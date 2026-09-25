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
      // Design system: cada token lleva su peso.
      // Display 1 (600) · Title H1 (500) · Title H2 (400) · Text base (400)
      // Text secondary (300) · Botones/Tags (600)
      fontSize: {
        display: ['48px', { lineHeight: '72px', fontWeight: '600' }],
        title1: ['36px', { lineHeight: '54px', fontWeight: '500' }],
        title2: ['28px', { lineHeight: '42px', fontWeight: '400' }],
        // "body" (20px) en lugar de sobrescribir "base", que es el 16px por defecto.
        body: ['20px', { lineHeight: '30px', fontWeight: '400' }],
        secondary: ['16px', { lineHeight: '24px', fontWeight: '300' }],
        tags: ['14px', { lineHeight: '21px', fontWeight: '600' }],
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
        primary: 'rgb(var(--primary-color) / <alpha-value>)',
        accent: 'rgb(var(--accent-color) / <alpha-value>)',
        danger: 'rgb(var(--danger-color) / <alpha-value>)',
        background: 'rgb(var(--background-color) / <alpha-value>)',
        dark: 'rgb(var(--dark-color) / <alpha-value>)',
        muted: 'rgb(var(--muted-color) / <alpha-value>)',
        success: 'rgb(var(--success-color) / <alpha-value>)',
        onSuccess: 'rgb(var(--on-success-color) / <alpha-value>)',
        neutral: 'rgb(var(--neutral-color) / <alpha-value>)',
        marvel: 'rgb(var(--marvel-color) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
