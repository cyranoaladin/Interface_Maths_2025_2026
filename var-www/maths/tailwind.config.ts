import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  content: ['site/**/*.{html,js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        'primary-600': '#1D4ED8',
        secondary: '#059669',
        accent: '#F59E0B',
        muted: '#6B7280',
        bg: '#F7FAFC',
        surface: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
};
