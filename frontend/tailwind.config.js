// ========== tailwind.config.js ==========
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "zoom-in": "zoom-in 0.2s ease-out forwards",
        "zoom-in-50": "zoom-in-50 0.2s ease-out forwards",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-top": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "zoom-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "zoom-in-50": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
    require("tailwindcss-animate"),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#06b6d4",
          "secondary": "#8b5cf6",
          "accent": "#f59e0b",
          "neutral": "#1e293b",
          "base-100": "#0d1220",
          "base-200": "#151b2e",
          "base-300": "#07090f",
          "info": "#38bdf8",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
        light: {
          "primary": "#0891b2",
          "secondary": "#7c3aed",
          "accent": "#d97706",
          "neutral": "#0f172a",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e8ecf2",
          "info": "#0284c7",
          "success": "#059669",
          "warning": "#d97706",
          "error": "#dc2626",
        },
      },
    ],
  },
};