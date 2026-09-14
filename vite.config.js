import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Timetable – Phillip Logan',
        short_name: 'Timetable',
        description: 'Semester 1 2026/27 class schedule — ECC, ECSE 3038 and tutorials',
        // Android paints an installed PWA's status bar from this value, baked in
        // at install time — the media-scoped theme-color metas in index.html only
        // re-tint the foreground icons. A manifest takes a single colour and
        // cannot follow prefers-color-scheme, so this is the dark --paper: light
        // icons over a light bar was unreadable.
        theme_color: '#0E1214',
        background_color: '#EEF1F2',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
