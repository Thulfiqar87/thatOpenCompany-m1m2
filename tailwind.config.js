/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#029ae0',
                    light: '#4ebdf2',
                    dark: '#01567d',
                }
            }
        },
    },
    plugins: [],
}
