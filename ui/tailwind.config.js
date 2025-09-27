/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#06b6d4',
        bgDark: '#0f172a',
        bgLight: '#1e293b',
        bgMid: '#111827',
        tag: { analyse: '#22c55e', algebre: '#3b82f6', geometrie: '#8b5cf6', probabilites: '#f97316', trigonometrie: '#eab308', arithmetique: '#ec4899' }
      },
      borderRadius: { card: '24px', section: '28px' },
      boxShadow: {
        soft: '0 4px 12px rgba(0,0,0,0.25)',
        glow: '0 0 12px rgba(6,182,212,0.6)'
      }
    }
  },
  plugins: []
}
