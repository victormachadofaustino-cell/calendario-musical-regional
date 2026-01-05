// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'assets/Logo_oficial_CCB.png'],
      manifest: {
        name: 'Calendário Musical Regional',
        short_name: 'Musical Jundiaí',
        description: 'Gestão de Ensaios Regionais e Locais - Jundiaí',
        theme_color: '#0F172A',
        background_color: '#F1F5F9',
        display: 'standalone',
        icons: [
          {
            src: 'assets/Logo_oficial_CCB.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/Logo_oficial_CCB.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})