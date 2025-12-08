/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4f46e5', // Indigo 600
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#1e293b', // Slate 800
                    foreground: '#f8fafc',
                },
                background: '#0f172a', // Slate 900
                foreground: '#f1f5f9', // Slate 100
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
