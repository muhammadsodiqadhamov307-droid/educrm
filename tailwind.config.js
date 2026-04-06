/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Manrope", "IBM Plex Sans", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 50px -28px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 40%), radial-gradient(circle at bottom right, rgba(148, 163, 184, 0.18), transparent 35%)",
      },
    },
  },
  plugins: [],
};
