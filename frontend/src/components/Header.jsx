import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center py-8 md:py-12 select-none">
      <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
        <ShieldCheck size={16} className="text-blue-400" />
        <span>Enterprise Security Grade</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
          ShieldURL
        </span>
      </h1>
      
      <p className="text-gray-400 text-lg max-w-lg mx-auto px-4 font-light leading-relaxed">
        Rút gọn liên kết siêu tốc bảo mật cao. Bảo vệ chống tấn công, hỗ trợ tùy biến liên kết và đặt thời hạn tồn tại.
      </p>
    </header>
  );
}
