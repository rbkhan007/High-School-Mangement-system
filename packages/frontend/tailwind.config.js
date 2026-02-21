/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                school: {
                    primary: '#1e40af', // Deep Blue
                    secondary: '#eab308', // Gold
                    accent: '#065f46', // Deep Green
                    background: '#f8fafc',
                    surface: '#ffffff',
                    error: '#dc2626',
                    success: '#16a34a',
                }
            },
            boxShadow: {
                '3d': '0 4px 0 0 rgba(0, 0, 0, 0.2)',
                '3d-hover': '0 2px 0 0 rgba(0, 0, 0, 0.2)',
                '3d-active': 'none',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
