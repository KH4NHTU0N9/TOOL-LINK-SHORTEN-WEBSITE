import express from 'express';
import Url from '../models/Url.js';
import { isRedisReady, redisClient } from '../config/db.js';
import { generateBase62Id } from '../utils/base62.js';
import { isValidUrl, isValidCustomAlias } from '../utils/validator.js';
import { getRateLimiter } from '../config/security.js';

const router = express.Router();

/**
 * @route   POST /api/shorten
 * @desc    Tạo link rút gọn mới từ URL gốc.
 * @access  Public (Có Rate Limiting bảo vệ)
 */
router.post('/api/shorten', getRateLimiter(), async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresInMinutes } = req.body;

    // 1. KIỂM TRA BẢO MẬT & ĐẦU VÀO (Input Validation)
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL gốc là bắt buộc' });
    }

    // Validate URL gốc để chặn đứng XSS, Open Redirect
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ 
        error: 'URL không hợp lệ hoặc giao thức không được hỗ trợ. Chỉ cho phép http:// hoặc https://' 
      });
    }

    let shortId = '';
    let isCustom = false;

    // 2. XỬ LÝ CUSTOM ALIAS (Nếu người dùng yêu cầu)
    if (customAlias) {
      const trimmedAlias = customAlias.trim();
      
      // Validate định dạng của custom alias (chữ, số, gạch ngang, dài 3-30 ký tự)
      if (!isValidCustomAlias(trimmedAlias)) {
        return res.status(400).json({ 
          error: 'Alias tự đặt không hợp lệ. Chỉ chấp nhận chữ cái, số, ký tự "_" hoặc "-" (từ 3 đến 30 ký tự) và không trùng từ khóa hệ thống.' 
        });
      }

      // Kiểm tra xem alias này đã tồn tại trong DB chưa để tránh ghi đè
      const existingUrl = await Url.findOne({ shortId: trimmedAlias });
      if (existingUrl) {
        return res.status(409).json({ error: 'Alias này đã được sử dụng. Vui lòng chọn alias khác.' });
      }

      shortId = trimmedAlias;
      isCustom = true;
    } else {
      // 3. TẠO ALIAS NGẪU NHIÊN VÀ PHÒNG NGỪA ĐỤNG ĐỘ (Collision Handling)
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 5) {
        // Sinh alias Base62 ngẫu nhiên dài 6 ký tự
        shortId = generateBase62Id(6);
        
        // Kiểm tra tính duy nhất trong MongoDB
        const existing = await Url.findOne({ shortId });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: 'Không thể tạo mã liên kết duy nhất vào lúc này. Vui lòng thử lại.' });
      }
    }

    // 4. XỬ LÝ TTL (Thời gian hết hạn của link)
    let expiresAt = null;
    if (expiresInMinutes && !isNaN(expiresInMinutes)) {
      const minutes = parseInt(expiresInMinutes, 10);
      if (minutes > 0) {
        expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      }
    }

    // 5. LƯU VÀO DATABASE MONGODB (Persist Data)
    const newUrl = new Url({
      originalUrl,
      shortId,
      customAlias: isCustom,
      expiresAt
    });

    await newUrl.save();

    // 6. GHI VÀO REDIS CACHE ĐỂ TĂNG TỐC ĐỘ ĐIỀU HƯỚNG (Write-Through Caching)
    if (isRedisReady()) {
      try {
        if (expiresAt) {
          // Tính số giây còn lại cho đến khi hết hạn để set TTL trong Redis khớp với MongoDB
          const remainingSeconds = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 1000));
          await redisClient.set(shortId, originalUrl, 'EX', remainingSeconds);
        } else {
          // Đối với link vĩnh viễn, lưu vào cache với thời gian sống mặc định (ví dụ: 7 ngày)
          // để tránh làm tràn bộ nhớ Redis trong khi vẫn phục vụ cực nhanh
          const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
          await redisClient.set(shortId, originalUrl, 'EX', ONE_WEEK_IN_SECONDS);
        }
      } catch (redisErr) {
        // Ghi log lỗi Redis nhưng KHÔNG làm fail request của user (Fault tolerance)
        console.error(`[Redis Cache Error] Failed to write cache for ${shortId}:`, redisErr.message);
      }
    }

    // Lấy Base URL từ biến môi trường
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const shortUrl = `${baseUrl}/${shortId}`;

    return res.status(201).json({
      message: 'Rút gọn liên kết thành công!',
      originalUrl,
      shortId,
      shortUrl,
      expiresAt,
    });

  } catch (error) {
    console.error('[API Error] Error in /shorten:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi xử lý rút gọn link' });
  }
});

/**
 * @route   GET /:shortId
 * @desc    Đoạn Router điều hướng (Redirect) với hiệu năng cao nhờ Redis.
 * @access  Public
 */
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;

    // 1. KIỂM TRA BỘ NHỚ ĐỆM REDIS TRƯỚC (Lớp Cache Hit - Tốc độ < 5ms)
    if (isRedisReady()) {
      try {
        const cachedUrl = await redisClient.get(shortId);
        
        if (cachedUrl) {
          // TẬN DỤNG BẤT ĐỒNG BỘ: Cập nhật lượt click trong MongoDB mà không bắt Client phải chờ đợi
          // Đây là kỹ thuật Fire-and-forget giúp tối ưu hóa thời gian phản hồi (low latency).
          Url.updateOne({ shortId }, { $inc: { clicks: 1 } })
            .exec()
            .catch(err => console.error(`[Stats Error] Failed to increment clicks for ${shortId}:`, err.message));

          // Chuyển hướng HTTP 302 (Found) để trình duyệt không cache cứng phía Client
          // Nhờ đó chúng ta vẫn theo dõi được lượt click ở những lần sau.
          return res.redirect(302, cachedUrl);
        }
      } catch (redisErr) {
        console.error(`[Redis Cache Error] Cache read failed, falling back to MongoDB:`, redisErr.message);
      }
    }

    // 2. FALLBACK TRUY VẤN MONGODB (Nếu cache miss hoặc Redis lỗi)
    const urlData = await Url.findOne({ shortId });

    if (!urlData) {
      return res.status(404).send(`
        <html>
          <head><title>Link Không Tồn Tại</title><meta charset="utf-8"></head>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6; color: #1f2937;">
            <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
              <h1 style="color: #ef4444; margin-bottom: 1rem;">404 - Không tìm thấy liên kết</h1>
              <p>Đường dẫn rút gọn này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.</p>
              <a href="/" style="display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Về trang chủ</a>
            </div>
          </body>
        </html>
      `);
    }

    // 3. KIỂM TRA HẾT HẠN LINK (TTL Validation)
    if (urlData.expiresAt && urlData.expiresAt < new Date()) {
      // Nếu link đã quá thời gian sống, trả về mã 410 Gone (hoặc 404)
      return res.status(410).send(`
        <html>
          <head><title>Liên Kết Đã Hết Hạn</title><meta charset="utf-8"></head>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6; color: #1f2937;">
            <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
              <h1 style="color: #f59e0b; margin-bottom: 1rem;">Liên kết đã hết hạn</h1>
              <p>Đường dẫn này đã hết thời gian hiệu lực (TTL) do người tạo thiết lập.</p>
              <a href="/" style="display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Về trang chủ</a>
            </div>
          </body>
        </html>
      `);
    }

    // 4. CẬP NHẬT LƯỢT CLICK & ĐỒNG BỘ CACHE LÊN REDIS (Self-Healing Cache)
    urlData.clicks += 1;
    await urlData.save();

    if (isRedisReady()) {
      try {
        if (urlData.expiresAt) {
          const remainingSeconds = Math.max(1, Math.round((urlData.expiresAt.getTime() - Date.now()) / 1000));
          await redisClient.set(shortId, urlData.originalUrl, 'EX', remainingSeconds);
        } else {
          const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
          await redisClient.set(shortId, urlData.originalUrl, 'EX', ONE_WEEK_IN_SECONDS);
        }
      } catch (redisErr) {
        console.error(`[Redis Cache Error] Failed to populate cache after fallback:`, redisErr.message);
      }
    }

    // 5. ĐIỀU HƯỚNG TRÌNH DUYỆT
    return res.redirect(302, urlData.originalUrl);

  } catch (error) {
    console.error('[API Error] Error in redirect:', error);
    return res.status(500).send('Lỗi hệ thống khi chuyển hướng liên kết.');
  }
});

export default router;
