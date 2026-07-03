import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'frontLogoBW.png'
      ],

      manifest: {
        name: 'BusiWage',
        short_name: 'BusiWage',
        description: 'Attendance app for contractors',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'frontLogoBW.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
