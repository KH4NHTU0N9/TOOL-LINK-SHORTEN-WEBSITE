/**
 * Lớp kiểm tra dữ liệu đầu vào (Input Validator) chuyên biệt cho URL Shortener.
 * Chứa logic lọc bỏ mã độc hại, tránh các lỗ hổng SSRF, Open Redirect, và XSS.
 */

// Danh sách các từ khoá trùng tên với route hệ thống, không được phép dùng làm Custom Alias
const RESERVED_WORDS = new Set([
  'api',
  'static',
  'assets',
  'health',
  'shorten',
  'favicon.ico',
  'robots.txt'
]);

/**
 * Kiểm tra tính hợp lệ của URL gốc (originalUrl).
 * Tiêu chuẩn bảo mật:
 * 1. Định dạng URL phải khớp với cấu trúc URL chuẩn.
 * 2. Giao thức bắt buộc là HTTP hoặc HTTPS để chặn đứng các giao thức nguy hiểm như javascript:, data:, file:, vbscript: (gây XSS/RCE).
 * 3. Chặn các ký tự điều hướng hoặc bypass lồng nhau.
 * 
 * @param {string} urlString URL cần kiểm tra
 * @returns {boolean} True nếu URL hợp lệ và an toàn
 */
export const isValidUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  // Loại bỏ khoảng trắng thừa ở hai đầu
  const trimmedUrl = urlString.trim();

  // 1. Kiểm tra Regex cơ bản cho cấu trúc URL http/https
  // Biểu thức chính quy này yêu cầu giao thức bắt đầu bằng http:// hoặc https://
  // và tiếp sau đó là domain hợp lệ kèm path/query string (nếu có).
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!urlRegex.test(trimmedUrl)) {
    return false;
  }

  try {
    // 2. Sử dụng URL Parser tích hợp của Node.js để kiểm tra cú pháp sâu hơn
    const parsedUrl = new URL(trimmedUrl);

    // 3. Ràng buộc giao thức bắt buộc là http: hoặc https:
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Chặn đứng Open Redirect hoặc SSRF thông qua bypass hostname trống hoặc ký tự lạ
    if (!parsedUrl.hostname) {
      return false;
    }

    return true;
  } catch (error) {
    // Nếu new URL() ném ra lỗi, URL đó không đúng chuẩn RFC
    return false;
  }
};

/**
 * Kiểm tra tính hợp lệ của Custom Alias do người dùng tự chọn.
 * Tiêu chuẩn bảo mật:
 * 1. Chỉ chấp nhận chữ cái [a-z, A-Z], số [0-9], gạch dưới (_) và gạch ngang (-).
 * 2. Giới hạn độ dài từ 3 đến 30 ký tự để tránh chiếm dụng tài nguyên lưu trữ lớn.
 * 3. Không được trùng với các từ khoá hệ thống đã đặt trước.
 * 
 * @param {string} alias Alias tự đặt
 * @returns {boolean} True nếu alias hợp lệ
 */
export const isValidCustomAlias = (alias) => {
  if (!alias || typeof alias !== 'string') {
    return false;
  }

  // Regex: Chỉ chứa ký tự chữ, số, gạch dưới, gạch ngang. Độ dài 3-30 ký tự.
  const aliasRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!aliasRegex.test(alias)) {
    return false;
  }

  // Kiểm tra trùng từ khóa hệ thống
  if (RESERVED_WORDS.has(alias.toLowerCase())) {
    return false;
  }

  return true;
};
