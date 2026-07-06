import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        id: '/',
        name: 'Phurti Arena',
        short_name: 'Phurti',
        description: 'საუკეთესო ქართული ონლაინ ბანქოს თამაში',
        theme_color: '#0c0a09', 
        background_color: '#0c0a09',
        display: 'standalone', 
        orientation: 'portrait', 
        categories: ['games', 'card', 'entertainment'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // დროებით ლოგოს ვიყენებთ სქრინშოთებად (მერე Play Console-ში ნამდვილებს ატვირთავ)
        screenshots: [
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    })
  ],
})