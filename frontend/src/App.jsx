import React, { useState } from 'react';
import Header from './components/Header';
import ShortenerForm from './components/ShortenerForm';
import ResultCard from './components/ResultCard';
import { ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [result, setResult] = useState(null);

  const handleShortenSuccess = (data) => {
    setResult(data);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Hiệu ứng Ambient Glow ở background */}
      <div className="bg-glow glow-blue"></div>
      <div className="bg-glow glow-purple"></div>

      <main className="flex-1 pb-16">
        <Header />
        
        <ShortenerForm onShortenSuccess={handleShortenSuccess} />
        
        {result && <ResultCard result={result} />}
      </main>

      {/* Footer chứa thông tin bảo mật của hệ thống */}
      <footer className="w-full py-6 border-t border-gray-900/50 backdrop-blur-md text-center text-gray-500 text-xs mt-12 select-none">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 justify-center">
            <Cpu size={14} className="text-blue-500/80" />
            <span>Chạy trên nền tảng Node.js, MongoDB & Redis Cache</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldAlert size={14} className="text-purple-500/80" />
            <span>Mã hóa bảo mật CSPRNG Base62 & Rate Limit Bảo Vệ</span>
          </div>
          <div>
            <span>© 2026 ShieldURL. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
