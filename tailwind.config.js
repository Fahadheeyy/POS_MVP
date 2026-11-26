/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF4F1A', mustard: '#FFC72C', ink: '#161412',
          paper: '#FFF4E0', oat: '#F3EEE6', muted: '#5E554C', rule: '#D9CFC0',
          50: '#FFF4E0', 500: '#FF4F1A', 700: '#9D2E12',
        },
        gray: {
          50: '#F3EEE6', 100: '#EAE2D6', 200: '#D9CFC0', 300: '#BCAD9B', 400: '#776B60',
          500: '#65594E', 600: '#5E554C', 700: '#473F37', 800: '#302923', 900: '#161412',
        },
        slate: {
          50: '#F3EEE6', 100: '#EAE2D6', 200: '#D9CFC0', 300: '#BCAD9B', 400: '#776B60',
          500: '#65594E', 600: '#5E554C', 700: '#473F37', 800: '#302923', 900: '#161412', 950: '#161412',
        },
        primary: {
          50: '#FFF0E5', 100: '#FFDDCC', 200: '#FFB398', 300: '#FF9169',
          400: '#FF784E', 500: '#FF4F1A', 600: '#D63A0C', 700: '#9D2E12',
          800: '#76240E', 900: '#581B0C', DEFAULT: '#FF4F1A',
        },
        accent: {
          50: '#FFF7DA', 100: '#FFEDAE', 200: '#FFDF74', 300: '#FFD24D',
          400: '#FFC72C', 500: '#FFC72C', 600: '#CE9D15', 700: '#775302',
          800: '#614301', 900: '#493302', DEFAULT: '#FFC72C',
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
        surface: {
          canvas: '#F3EEE6', card: '#FFF4E0', subtle: '#FFF9EE',
          muted: '#EAE2D6', dark: '#302923', darker: '#161412',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
        display: ['Bowlby One', 'Arial Black', 'sans-serif'],
      },
      borderRadius: { lg: '8px', xl: '10px', '2xl': '12px', '3xl': '14px' },
      boxShadow: {
        xs: '1px 1px 0 #161412',
        subtle: '2px 2px 0 #161412',
        card: '4px 4px 0 #161412',
        modal: '6px 6px 0 #161412',
      },
    },
  },
  plugins: [],
};
