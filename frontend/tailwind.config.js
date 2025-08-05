/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '72px' }],
        title1: ['36px', { lineHeight: '54px' }],
        title2: ['28px', { lineHeight: '42px' }],
        base: ['20px', { lineHeight: '30px' }],
        secondary: ['16px', { lineHeight: '24px' }],
        tags: ['14px', { lineHeight: '21px' }],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
      },
      spacing: {
        xs: '4px',
        s: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      colors: {
        primary: 'var(--primary-color)',
        danger: 'var(--danger-color)',
        background: 'var(--background-color)',
        dark: 'var(--dark-color)',
        muted: 'var(--muted-color)',
        success: 'var(--success-color)',
        neutral: 'var(--neutral-color)',
      },
    },
  },
  plugins: [],
}