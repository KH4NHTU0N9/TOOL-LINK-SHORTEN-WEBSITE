/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tông màu tối hiện đại kết hợp HSL gradient cao cấp
        dark: {
          bg: '#0B0F19',
          card: 'rgba(17, 24, 39, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          primary: '#3B82F6',   // Xanh dương
          secondary: '#8B5CF6', // Tím hồng
          accent: '#10B981',    // Xanh ngọc lục bảo (Emerald)
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
