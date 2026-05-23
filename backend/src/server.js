import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import urlRouter from './routes/url.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. KẾT NỐI CƠ SỞ DỮ LIỆU
connectDB();

// 2. MIDDLEWARE BẢO MẬT & ĐĂNG NHẬP HỆ THỐNG
// Helmet cấu hình các HTTP response header để bảo vệ ứng dụng khỏi các lỗ hổng web phổ biến
app.use(helmet());

// Cấu hình CORS để cho phép Frontend truy cập tài nguyên
app.use(
  cors({
    origin: '*', // Trong production nên cấu hình chi tiết (ví dụ: 'http://localhost:5173')
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Morgan ghi nhận lịch sử HTTP requests cho mục đích giám sát
app.use(morgan('dev'));

// Bộ phân tích cú pháp JSON trong Request Body với giới hạn kích thước tối đa 10kb
// Tránh việc kẻ tấn công gửi payload cực lớn gây tràn bộ nhớ (Payload Too Large / DoS)
app.use(express.json({ limit: '10kb' }));

// 3. ĐỊNH TUYẾN (Routing)
// Mount toàn bộ router lên root path
app.use('/', urlRouter);

// 4. XỬ LÝ LỖI TẬP TRUNG (Centralized Error Handler)
// Chặn lỗi 404 cho các route không khớp
app.use((req, res, next) => {
  res.status(404).json({ error: 'Đường dẫn API không tồn tại' });
});

// Middleware xử lý lỗi 500, đảm bảo không rò rỉ Stack Trace hệ thống ra ngoài
app.use((err, req, res, next) => {
  console.error('[System Error] Unhandled Exception:', err.stack);
  res.status(500).json({
    error: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.',
  });
});

// 5. BẮT ĐẦU CHẠY SERVER
app.listen(PORT, () => {
  console.log(`[Server] Application is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
