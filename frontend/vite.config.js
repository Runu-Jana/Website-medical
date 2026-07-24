import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'DBL Life Care — Online Pharmacy',
        short_name: 'DBL Life Care',
        description: 'Order medicines, book lab tests and consult doctors online.',
        theme_color: '#0e9f8e',
        background_color: '#0e9f8e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell; never cache API calls (always live data).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The onboarding hero shows once and is served by the runtime image
        // cache below — keep it out of the precache so a large illustration
        // never blocks the build or bloats the service worker.
        globIgnores: ['**/onboarding-pharmacist.png'],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
          {
            // Product/remote images — serve fast from cache, refresh in background.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'images', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      // Don't turn on the service worker during `npm run dev`.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
  },
})
