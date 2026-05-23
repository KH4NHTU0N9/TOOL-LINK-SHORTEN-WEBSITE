import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, isRedisReady } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// Đọc cấu hình từ biến môi trường hoặc dùng giá trị mặc định
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000; // 1 phút
const MAX_LIMIT = parseInt(process.env.RATE_LIMIT_MAX, 10) || 10; // Tối đa 10 requests

/**
 * Cấu hình Rate Limiter phân tán sử dụng Redis làm Storage.
 * Nếu Redis gặp sự cố, hệ thống sẽ tự động hạ cấp xuống sử dụng bộ nhớ trong (MemoryStore) của Express.
 */
export const getRateLimiter = () => {
  const storeConfig = {};

  if (isRedisReady()) {
    // Sử dụng Redis để lưu trạng thái Rate Limit, phù hợp cho hệ thống chạy đa máy chủ (Multi-instance)
    storeConfig.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:shorten:', // Tiền tố lưu trữ trong Redis
    });
    console.log('[Security] Redis rate limit store activated.');
  } else {
    console.warn('[Security Warning] Redis is offline. Rate limiting is running in-memory (not shared).');
  }

  return rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_LIMIT,
    standardHeaders: true, // Trả về thông tin giới hạn trong header `RateLimit-*`
    legacyHeaders: false, // Tắt header cũ `X-RateLimit-*`
    message: {
      error: `Bạn đã tạo link quá nhanh. Giới hạn hiện tại là ${MAX_LIMIT} link mỗi phút. Vui lòng đợi và thử lại sau.`
    },
    ...storeConfig
  });
};
