import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Biến trạng thái để kiểm tra tính sẵn sàng của Redis
let redisConnected = false;
let redisClient = null;

/**
 * Kết nối tới MongoDB với cấu hình khuyên dùng để tránh các lỗi kết nối phổ biến.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true, // Tự động tạo index từ schema (hữu ích cho TTL index và unique index)
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    process.exit(1); // Dừng app nếu không thể kết nối Database chính
  }
};

/**
 * Khởi tạo client Redis với cơ chế tự phục hồi (failover) và chống treo.
 */
const initRedis = () => {
  if (!process.env.REDIS_URI) {
    console.warn('[Redis Warning] REDIS_URI is not defined. Redis caching is disabled.');
    return null;
  }

  const client = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: 1, // Giới hạn số lần thử lại để tránh treo Node.js process khi Redis down
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000); // Thử lại sau tối đa 3 giây
      return delay;
    },
    // Giới hạn thời gian kết nối tối đa
    connectTimeout: 5000, 
  });

  client.on('connect', () => {
    redisConnected = true;
    console.log('[Database] Redis client connecting...');
  });

  client.on('ready', () => {
    redisConnected = true;
    console.log('[Database] Redis is ready and active.');
  });

  client.on('error', (err) => {
    redisConnected = false;
    console.error(`[Redis Error] Redis connection failed: ${err.message}`);
  });

  client.on('end', () => {
    redisConnected = false;
    console.log('[Redis Connection] End of Redis connection session.');
  });

  return client;
};

// Khởi tạo Redis client duy nhất
redisClient = initRedis();

export { redisClient };

/**
 * Trả về trạng thái kết nối hiện tại của Redis
 * Giúp cho Router biết có thể đọc/ghi cache hay cần fallback trực tiếp xuống MongoDB
 */
export const isRedisReady = () => {
  return redisConnected && redisClient && redisClient.status === 'ready';
};
