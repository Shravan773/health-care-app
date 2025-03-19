import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icon.png', 'icon-512x512.png'],
      manifest: {
        name: 'Healthcare Clock App',
        short_name: 'HealthClock',
        description: 'Healthcare staff clock-in/out management',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        display: 'standalone',
        start_url: '/',
        background_color: '#ffffff'
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',  // This needs to be production URL
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      usePolling: true
    },
    host: true
  },
  preview: {
    port: 5173,
    strictPort: true
  }
});