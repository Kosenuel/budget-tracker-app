/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors') // If using default colors like cyan

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' if you prefer OS setting
  theme: {
    extend: {
        colors: {
            primary: { // Example using cyan, adjust as needed
                light: colors.cyan[300], // '#67e8f9',
                DEFAULT: colors.cyan[500], // '#06b6d4',
                dark: colors.cyan[700], // '#0e7490',
             },
             accent: { // Example accent
                DEFAULT: colors.orange[500], // '#f97316',
                dark: colors.orange[600], // '#ea580c',
            }
            // Define your 'primary' and 'accent' colors if not already done
            // Example:
            // primary: '#YourPrimaryColorHex', // eg: '#06B6D4' (Tailwind Cyan 500)
            // 'primary-dark': '#YourPrimaryDarkColorHex', // eg: '#0E7490' (Tailwind Cyan 700)
            // accent: '#YourAccentColorHex' // eg: '#F97316' (Tailwind Orange 500)
         },
    },
  },
  plugins: [
     require('@tailwindcss/forms'), // Crucial for better default form styling
  ],
}