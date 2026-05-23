import crypto from 'crypto';

// Bảng chữ cái Base62 chuẩn chứa 62 ký tự [0-9, A-Z, a-z]
const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CHARSET_LENGTH = BASE62_CHARSET.length; // 62

/**
 * Sinh mã định danh (alias) ngẫu nhiên bằng bộ sinh số ngẫu nhiên mã hóa bảo mật (Cryptographically Secure Pseudo-Random Number Generator - CSPRNG).
 * Điều này ngăn chặn việc đoán trước các URL đã được tạo, tránh lỗ hổng bảo mật rò rỉ dữ liệu thông qua việc đoán số tăng dần (Insecure Direct Object Reference - IDOR).
 * 
 * @param {number} length Độ dài của chuỗi alias cần tạo (mặc định là 6)
 * @returns {string} Chuỗi Base62 ngẫu nhiên
 */
export const generateBase62Id = (length = 6) => {
  // Sinh các byte ngẫu nhiên bằng mô đun crypto của Node.js
  const randomBytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    // Phép chia lấy dư byte ngẫu nhiên cho 62 để lấy index trong bảng chữ cái Base62
    const randomIndex = randomBytes[i] % CHARSET_LENGTH;
    result += BASE62_CHARSET[randomIndex];
  }

  return result;
};
