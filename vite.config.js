import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 🎨 Keeps your Tailwind CSS styles working perfectly
  ],
  base: '/Nurse-Booking-App/', // 🚀 Keeps your GitHub Pages paths aligned
})