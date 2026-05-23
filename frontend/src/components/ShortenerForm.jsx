import React, { useState } from 'react';
import { Link2, Sparkles, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function ShortenerForm({ onShortenSuccess }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!originalUrl) {
      setError('Vui lòng nhập đường dẫn gốc cần rút gọn.');
      return;
    }

    // Kiểm tra định dạng cơ bản bằng Regex trên client
    const clientRegex = /^https?:\/\/.+/i;
    if (!clientRegex.test(originalUrl.trim())) {
      setError('Đường dẫn bắt buộc phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    setLoading(true);

    try {
      // Gửi yêu cầu lên Backend Express API
      // Sử dụng root relative URL vì frontend và backend có thể được reverse proxy chung,
      // hoặc gọi trực tiếp localhost:5000 nếu dev riêng biệt
      const apiEndpoint = 'http://localhost:5000/api/shorten';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          customAlias: customAlias.trim() || undefined,
          expiresInMinutes: expiresInMinutes ? parseInt(expiresInMinutes, 10) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình xử lý.');
      }

      // Thông báo thành công cho App cha và truyền data
      onShortenSuccess(data);
      // Reset form
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresInMinutes('');
      setShowAdvanced(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-2xl hover-glow space-y-6">
        
        {/* URL Input Row */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 block">Đường dẫn gốc (URL)</label>
          <div className="relative rounded-xl overflow-hidden shadow-inner">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Link2 size={20} />
            </div>
            <input
              type="url"
              placeholder="Nhập đường dẫn https://example.com/very-long-path..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-base placeholder-gray-500 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Nút bật tắt Cấu hình nâng cao */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors select-none"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>Tùy chỉnh nâng cao (Custom Alias / Hạn dùng)</span>
        </button>

        {/* Các cấu hình nâng cao */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-slide-up">
            {/* Custom Alias */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="text-purple-400" />
                <span>Custom Alias (Tùy chọn)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ten-cua-toi"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-xl text-sm placeholder-gray-600"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Expiration Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-indigo-400" />
                <span>Thời hạn liên kết</span>
              </label>
              <select
                value={expiresInMinutes}
                onChange={(e) => setExpiresInMinutes(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-xl text-sm text-gray-300 bg-[#0B0F19] cursor-pointer"
                disabled={loading}
              >
                <option value="">Vĩnh viễn (Không hết hạn)</option>
                <option value="5">5 Phút</option>
                <option value="60">1 Giờ</option>
                <option value="1440">1 Ngày (24 giờ)</option>
                <option value="10080">7 Ngày</option>
              </select>
            </div>
          </div>
        )}

        {/* Nút Submit */}
        <button
          type="submit"
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Đang mã hóa & bảo mật...</span>
            </>
          ) : (
            <span>Tạo liên kết rút gọn</span>
          )}
        </button>

        {/* Hiển thị thông tin lỗi nếu có */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 animate-slide-up">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

      </form>
    </div>
  );
}
