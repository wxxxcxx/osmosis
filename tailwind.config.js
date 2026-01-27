/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Token Mapping using HSL
        main: "hsl(var(--main))",
        "main-soft": "hsl(var(--main-soft))",
        surface: "hsl(var(--bg-surface))",
        "surface-secondary": "hsl(var(--bg-surface-secondary))",

        "text-primary": "hsl(var(--text-primary))",
        "text-muted": "hsl(var(--text-muted))",

        border: "hsl(var(--border))",
        "border-highlight": "hsl(var(--border-highlight))",

        "star-fill": "hsl(var(--star-fill))",
        "star-text": "hsl(var(--star-text))"
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        marquee: 'marquee var(--duration) linear infinite',
        shimmer: 'shimmer 2s infinite',
      }
    }
  },
  plugins: []
}