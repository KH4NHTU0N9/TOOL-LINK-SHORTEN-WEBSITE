// Sử dụng API fetch tích hợp sẵn của Node.js >= 18
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====== BẮT ĐẦU KIỂM TRA BẢO MẬT & API URL SHORTENER ======\n');

  try {
    // 1. Kiểm tra rút gọn URL hợp lệ
    console.log('[Test 1] Tạo link rút gọn với URL hợp lệ...');
    const res1 = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: 'https://google.com' })
    });
    const data1 = await res1.json();
    console.log(`Kết quả: HTTP ${res1.status}`, data1);
    const shortId = data1.shortId;

    // 2. Kiểm tra điều hướng (Redirect)
    if (shortId) {
      console.log(`\n[Test 2] Thử nghiệm Redirect với ID: ${shortId}...`);
      const res2 = await fetch(`${BASE_URL}/${shortId}`, {
        method: 'GET',
        redirect: 'manual' // Để không tự động follow, giúp kiểm tra HTTP Header
      });
      console.log(`Kết quả: HTTP ${res2.status}`);
      console.log(`Location Header: ${res2.headers.get('location')}`);
    }

    // 3. Kiểm tra chèn mã độc (XSS / Invalid protocol)
    console.log('\n[Test 3] Gửi URL độc hại dạng javascript:alert(1)...');
    const res3 = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: 'javascript:alert(1)' })
    });
    const data3 = await res3.json();
    console.log(`Kết quả: HTTP ${res3.status}`, data3);

    // 4. Kiểm tra chèn XSS html
    console.log('\n[Test 4] Gửi URL chứa mã HTML chèn script...');
    const res4 = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: 'https://test.com/<script>alert(1)</script>' })
    });
    const data4 = await res4.json();
    console.log(`Kết quả: HTTP ${res4.status}`, data4);

    // 5. Kiểm tra Custom Alias không hợp lệ
    console.log('\n[Test 5] Gửi Custom Alias chứa ký tự lạ (khoảng trắng)...');
    const res5 = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalUrl: 'https://valid.com', customAlias: 'my alias' })
    });
    const data5 = await res5.json();
    console.log(`Kết quả: HTTP ${res5.status}`, data5);

    // 6. Kiểm tra Rate Limiting (Gửi liên tiếp nhiều requests)
    console.log('\n[Test 6] Gửi liên tiếp 12 requests để kích hoạt Rate Limiting (Giới hạn 10 req/phút)...');
    let triggeredLimit = false;
    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${BASE_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: `https://test-${i}.com` })
      });
      const status = res.status;
      const data = await res.json();
      console.log(`Request #${i}: HTTP ${status} - ${data.error ? 'Bị chặn: ' + data.error : 'Thành công: ' + data.shortId}`);
      if (status === 429) {
        triggeredLimit = true;
      }
    }

    if (triggeredLimit) {
      console.log('\n✅ KẾT QUẢ: Kiểm thử Rate Limiting thành công! API trả về HTTP 429 đúng như cấu hình.');
    } else {
      console.log('\n❌ KẾT QUẢ: Kiểm thử Rate Limiting thất bại. Không bị chặn bởi HTTP 429.');
    }

  } catch (error) {
    console.error('Lỗi khi chạy bộ kiểm thử:', error.message);
  }
}

// Chạy test sau 1s để chắc chắn server đã khởi động nếu chạy tự động
runTests();
