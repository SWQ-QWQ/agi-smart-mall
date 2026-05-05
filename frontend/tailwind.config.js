/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff5000',
        secondary: '#ff0036',
        'taobao-orange': '#ff5000',
        'taobao-red': '#ff0036',
        'taobao-gray': '#f5f5f5',
        'price-red': '#ff0036'
      }
    }
  },
  plugins: []
}
