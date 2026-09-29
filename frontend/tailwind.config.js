/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lifeos: {
          bg: '#F5F7FB',
          card: '#FFFFFF',
          navy: '#0B192C',
          dark: '#0F172A',
          blue: '#1E60F2',
          blueLight: '#EBF2FF',
          blueDark: '#1244B8',
          accent: '#2970FF',
          muted: '#64748B',
          subtle: '#94A3B8',
          border: '#E2E8F0',
          lavender: '#F3E8FF',
          lavenderText: '#7C3AED',
          mint: '#DCFCE7',
          mintText: '#15803D',
          sky: '#E0F2FE',
          skyText: '#0284C7',
          cream: '#FEF3C7',
          creamText: '#B45309',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft': '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'soft-md': '0 8px 20px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'soft-lg': '0 12px 28px -6px rgba(15, 23, 42, 0.08), 0 6px 14px -3px rgba(15, 23, 42, 0.04)',
        'nav': '0 -4px 16px -2px rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
