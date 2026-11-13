/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gray tokens from design system (image 3022)
        gray: {
          50: '#f0f0f2',
          100: '#d0d2d8',
          200: '#b9bcc5',
          300: '#989daa',
          400: '#858a99',
          500: '#666d80',
          600: '#5d6374',
          700: '#484d5b',
          800: '#383c46',
          900: '#2b2e36',
        },
        // Primary Coral / Red tokens (image 3022)
        primary: {
          50: '#ffedee',
          100: '#ffc6c9',
          200: '#ffaaaf',
          300: '#ff848a',
          400: '#ff6c73',
          500: '#ff4750',
          600: '#e84149',
          700: '#b53239',
          800: '#8c272c',
          900: '#6b1e22',
          DEFAULT: '#ff4750',
        },
        // Accent Yellow tokens (image 3022)
        accent: {
          50: '#fff9e6',
          100: '#ffeeb0',
          200: '#ffe38a',
          300: '#ffd655',
          400: '#ffce34',
          500: '#ffc201',
          600: '#e8b101',
          700: '#b58a01',
          800: '#8c6b01',
          900: '#6b5100',
        },
        // Secondary Red tokens (image 3022)
        secondaryRed: {
          50: '#feeceb',
          100: '#fbc5c1',
          200: '#f9a9a3',
          300: '#f68279',
          400: '#f4695f',
          500: '#f14437',
          600: '#db3e32',
          700: '#ab3027',
          800: '#85251e',
          900: '#651d17',
        },
        // Secondary Orange tokens (image 3022)
        secondaryOrange: {
          50: '#fef4e7',
          100: '#fdddb4',
          200: '#fbcb8f',
          300: '#fab55c',
          400: '#f9a63d',
          500: '#f7900c',
          600: '#e1830b',
          700: '#af6609',
          800: '#884f07',
          900: '#683c05',
        },
        // Secondary Green tokens (image 3022)
        secondaryGreen: {
          50: '#ecf9f7',
          100: '#c4ede5',
          200: '#a7e4d8',
          300: '#7fd7c6',
          400: '#66d0bb',
          500: '#40c4aa',
          600: '#3ab29b',
          700: '#2d8b79',
          800: '#236c5e',
          900: '#1b5247',
        },
        // Cool slate background surface neutrals (KDS and POS)
        surface: {
          canvas: '#f8fafc',
          card: '#ffffff',
          subtle: '#f1f5f9',
          muted: '#e2e8f0',
          dark: '#1e293b',
          darker: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

