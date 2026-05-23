import mongoose from 'mongoose';

const UrlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Thêm index để tối ưu hóa tốc độ truy vấn khi người dùng truy cập link rút gọn
    },
    customAlias: {
      type: Boolean,
      default: false,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null, // null nghĩa là link không bao giờ hết hạn
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Tạo TTL Index (Time-To-Live) trên trường expiresAt
// MongoDB sẽ tự động quét và xoá các tài liệu khi thời gian hiện tại vượt quá expiresAt.
// Thiết lập expireAfterSeconds là 0 để xoá chính xác tại mốc expiresAt.
UrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Url = mongoose.model('Url', UrlSchema);

export default Url;
