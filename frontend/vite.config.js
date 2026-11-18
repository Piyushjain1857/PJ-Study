import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Never force reloads during active uploads or editing
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'offline.html'
      ],
      manifest: {
        name: 'PJ Study',
        short_name: 'PJ Study',
        description:
          'Your Entire Study World, One Place. Academic notes and AI-powered study platform.',
        theme_color: '#245C46',
        background_color: '#F5F4F0',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['education', 'productivity', 'books'],
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
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/offline.html',
        // Do NOT route backend APIs or Swagger docs through SPA offline fallback
        navigateFallbackDenylist: [/^\/api/, /^\/api-docs/, /^\/docs/, /^\/swagger/],
        runtimeCaching: [
          // 1. Google Fonts stylesheets (stale-while-revalidate)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 2. Google Fonts webfont files (cache-first for 1 year)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 3. Static local images (stale-while-revalidate for 30 days)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // 4. CRITICAL SECURITY INVARIANT: All API routes MUST be NetworkOnly
          // Never persist auth tokens, user profiles, admin queues, or private notes in SW cache
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/api-docs': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/docs': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/swagger': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('react-router') || id.includes('@remix-run')) {
              return 'vendor-router';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
          }
        }
      }
    }
  }
});
