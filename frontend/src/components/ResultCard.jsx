import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, ExternalLink, Calendar } from 'lucide-react';

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);
  const { shortUrl, originalUrl, expiresAt } = result;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset icon sau 2 giây
    } catch (err) {
      console.error('Không thể sao chép liên kết:', err);
    }
  };

  const handleDownloadQRCode = () => {
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) return;

    // Chuyển đổi SVG thành PNG để người dùng tải xuống dễ dàng
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const context = canvas.getContext('2d');
      
      // Vẽ nền trắng cho QR code để scan dễ hơn
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Vẽ QR Code
      context.drawImage(image, 10, 10, 280, 280);
      
      const pngURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngURL;
      downloadLink.download = `qrcode-${result.shortId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-8 animate-slide-up">
      <div className="glass-panel p-6 md:p-8 rounded-2xl border-l-4 border-l-blue-500 space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow inside the card */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          Liên kết đã sẵn sàng!
        </h2>

        {/* Short URL Copy Bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đường dẫn rút gọn</label>
          <div className="flex gap-2">
            <div className="relative flex-1 rounded-xl overflow-hidden">
              <input
                type="text"
                readOnly
                value={shortUrl}
                className="w-full px-4 py-3.5 pr-12 glass-input rounded-xl text-base font-semibold text-blue-400 bg-blue-950/20"
              />
              <a 
                href={shortUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors"
                title="Mở tab mới"
              >
                <ExternalLink size={18} />
              </a>
            </div>
            
            <button
              onClick={handleCopy}
              className={`px-5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-500/10' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* QR Code and Meta Details */}
        <div className="flex flex-col md:flex-row gap-6 items-center pt-4 border-t border-gray-800">
          
          {/* QR Box */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-inner inline-block">
              <QRCodeSVG
                id="qr-code-svg"
                value={shortUrl}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>
            <button
              onClick={handleDownloadQRCode}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Download size={14} />
              <span>Tải xuống mã QR Code</span>
            </button>
          </div>

          {/* Meta Details */}
          <div className="flex-1 space-y-4 self-start">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 block uppercase tracking-wider">Đường dẫn gốc</span>
              <p className="text-sm text-gray-400 break-all line-clamp-2 pr-2" title={originalUrl}>
                {originalUrl}
              </p>
            </div>

            {expiresAt ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                <Calendar size={14} />
                <span>Hết hạn: {new Date(expiresAt).toLocaleString('vi-VN')}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Calendar size={14} />
                <span>Thời hạn: Vĩnh viễn</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
