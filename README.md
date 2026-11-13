# ShieldURL - Secure & High Performance URL Shortener

Hệ thống rút ngắn liên kết (URL Shortener) hoàn chỉnh, bảo mật cao và tối ưu hiệu suất sử dụng React.js (Vite) + Tailwind CSS ở Frontend, Node.js (Express) + MongoDB + Redis ở Backend.

Hệ thống đạt tiêu chuẩn doanh nghiệp với cơ chế lưu trữ đệm (caching) đa lớp, hạn chế tấn công DDoS thông qua Rate Limiting được phân phối bởi Redis và thuật toán sinh mã độc nhất an toàn CSPRNG Base62.

---

## Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, QR Code Generator.
- **Backend**: Node.js (Express), ESM Syntax.
- **Database**: MongoDB (lưu trữ metadata lâu dài & TTL tự động xóa).
- **Cache & Rate Limiting**: Redis (tăng tốc độ điều hướng < 5ms & chặn spam request).

---

## Sơ Đồ Cấu Trúc Thư Mục

```text
secure-url-shortener/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ │ ├── db.js # Kết nối MongoDB & Redis (có cơ chế tự phục hồi)
│ │ │ └── security.js # Cấu hình CORS & Rate Limiter dựa trên Redis
│ │ ├── models/
│ │ │ └── Url.js # Mongoose Schema & TTL Index tự động xoá
│ │ ├── utils/
│ │ │ ├── base62.js # Sinh ID Base62 ngẫu nhiên an toàn bảo mật (CSPRNG)
│ │ │ └── validator.js # Kiểm duyệt URL đầu vào chống XSS và Injection
│ │ ├── routes/
│ │ │ └── url.js # API Route tạo link và điều hướng (Redirect)
│ │ └── server.js # Khởi chạy server Express chính
│ ├── .env.example # Biến môi trường mẫu
│ └── package.json # Các thư viện phụ thuộc của Backend
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx      # Component tiêu đề thương hiệu
│   │   │   ├── ShortenerForm.jsx # Form nhập liệu, custom alias, chọn TTL
│   │   │   └── ResultCard.jsx  # Hiển thị link kết quả, copy clipboard, QR Code
│   │   ├── App.jsx            # Layout chính và quản lý State
│   │   ├── index.css          # CSS thiết lập Glassmorphism & Background Glow
│   │   └── main.jsx           # Entrypoint React
│   ├── index.html             # Cấu hình SEO meta tag chuẩn
│   ├── tailwind.config.js     # Thiết lập Theme màu tối cao cấp
│   └── package.json           # Các thư viện phụ thuộc của Frontend
├── docker-compose.yml         # Container chạy nhanh MongoDB & Redis local
├── test_api.js                # Kịch bản kiểm thử bảo mật tự động
└── README.md                  # Hướng dẫn này
```

---

## 🔑 Cấu Hình Biến Môi Trường (.env)

Vào thư mục `backend`, tạo file `.env` (hoặc copy từ `.env.example` đã được tạo sẵn):

```env
# Server
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Databases
MONGODB_URI=mongodb://localhost:27017/url_shortener
REDIS_URI=redis://localhost:6379

# Security Settings
RATE_LIMIT_WINDOW_MS=60000 # Thời gian tính giới hạn (1 phút = 60000ms)
RATE_LIMIT_MAX=10          # Tối đa 10 requests tạo link từ 1 IP trong 1 phút
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Khởi động MongoDB và Redis
Nếu bạn đã cài sẵn Docker trên máy, hãy chạy lệnh dưới đây ở thư mục gốc của dự án để khởi động nhanh hai cơ sở dữ liệu:
```bash
docker-compose up -d
```
*Lưu ý: Nếu không sử dụng Docker, bạn hãy đảm bảo dịch vụ MongoDB và Redis cục bộ trên hệ điều hành đang được chạy ở cổng mặc định (27017 và 6379).*

### Bước 2: Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện cần thiết (nếu chưa cài):
   ```bash
   npm install
   ```
3. Chạy Server ở chế độ nhà phát triển (tự động restart khi sửa code):
   ```bash
   npm run dev
   ```
   *Backend sẽ lắng nghe tại cổng http://localhost:5000*

### Bước 3: Khởi chạy Frontend
1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Chạy giao diện Web:
   ```bash
   npm run dev
   ```
   *Giao diện sẽ chạy tại cổng http://localhost:5173 (hoặc cổng trống tiếp theo).*

---

## 🧪 Kịch Bản Kiểm Thử Bảo Mật Tự Động (API Test)

Để kiểm chứng toàn bộ logic xử lý chuỗi, khả năng chống tấn công XSS, Open Redirect và kiểm tra giới hạn Rate Limit (10 link/phút), bạn có thể chạy file kiểm thử tự động bằng lệnh sau ở thư mục gốc dự án:

```bash
# Đảm bảo backend server (localhost:5000) đang hoạt động trước khi chạy lệnh này
node test_api.js
```

### Các kịch bản test_api.js thực hiện:
1. **Tạo URL hợp lệ**: Kiểm chứng đầu ra của Base62 và định dạng Short URL.
2. **Kiểm tra Redirect**: Thử truy cập ID vừa tạo để xác nhận redirect mã HTTP 302 về trang gốc.
3. **Chặn giao thức lạ**: Gửi link độc hại `javascript:alert(1)` (Mong đợi: HTTP 400).
4. **Chặn thẻ HTML script**: Gửi link chứa `<script>` (Mong đợi: HTTP 400).
5. **Chặn Custom Alias sai định dạng**: Gửi alias chứa khoảng trắng (Mong đợi: HTTP 400).
6. **Kiểm thử DDoS/Spam (Rate Limit)**: Gửi liên tiếp 12 requests tạo link trong vài giây (Mong đợi: 10 requests đầu thành công, 2 requests cuối bị chặn trả về mã lỗi HTTP 429).
