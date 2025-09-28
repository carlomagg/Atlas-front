/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Override default Tailwind font sizes with larger values for better readability
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px instead of 12px
        'sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px instead of 14px
        'base': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px instead of 16px
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px instead of 18px
        'xl': ['1.375rem', { lineHeight: '1.875rem' }],   // 22px instead of 20px
        '2xl': ['1.625rem', { lineHeight: '2rem' }],      // 26px instead of 24px
        '3xl': ['2rem', { lineHeight: '2.25rem' }],       // 32px instead of 30px
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],     // 40px instead of 36px
        '5xl': ['3.25rem', { lineHeight: '3.5rem' }],     // 52px instead of 48px
        '6xl': ['4rem', { lineHeight: '4.25rem' }],       // 64px instead of 60px
      }
    },
  },
  plugins: [],
}
