/** @type {import('tailwindcss').Config} */

// Light version of the logo navy (#2B368F) — royal blue ramp used for every blue across the app
const navy = {
  50: '#f1f3fc',
  100: '#e3e7f8',
  200: '#c9d0f1',
  300: '#a5b0e6',
  400: '#7f8ed8',
  500: '#5b6dc8',
  600: '#4254b0',
  700: '#364599',
  800: '#2b368f',
  900: '#212a70',
  950: '#161b48',
};

// Brand green (from the logo) — used for primary actions and accents; navy stays the base/dark colour
const green = {
  50: '#f0faf1',
  100: '#dcf3df',
  200: '#b9e6c0',
  300: '#8fd49b',
  400: '#62bf71',
  500: '#43a853',
  600: '#2f8f3f',
  700: '#267535',
  800: '#205c2c',
  900: '#1a4a25',
  950: '#0f2d16',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: navy,
        sky: navy,
        blue: navy,
        green,
        emerald: green,
      },
      spacing: {
        '1': '0.2rem',
        '2': '0.4rem',
        '3': '0.6rem',
        '4': '0.8rem',
        '5': '1rem',
        '6': '1.2rem',
        '8': '1.6rem',
        '10': '2rem',
        '12': '2.4rem',
        '16': '3.2rem',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      }
    },
  },
  plugins: [],
};