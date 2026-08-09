/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx,md,mdx}', // پشتیبانی از mdx اضافه شد
    './components/**/*.{js,jsx,ts,tsx}',
    './theme.config.tsx'
  ],
  theme: {
    extend: {
      colors: {
        agent: {
          gold: '#F0D59A',
          dark: '#050505',
          gray: '#2A2A2A',
          lightGray: '#A1A1AA'
        }
      },
      fontFamily: {
        // متغیرهای CSS که در مرحله بعد می‌سازیم را اینجا معرفی می‌کنیم
        pixel: ['var(--font-pixel)', 'cursive'],
        ibm: ['var(--font-ibm)', 'monospace'],
      }
    }
  },
  plugins: [],
}