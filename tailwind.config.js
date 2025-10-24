/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme")

module.exports = {
  darkMode: ["class"],
  content: [
    './ui/pages/**/*.{ts,tsx}',
    './ui/components/**/*.{ts,tsx}',
    './ui/app/**/*.{ts,tsx}',
    './ui/src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // 自定义 Discuz! 风格颜色
        'discuz-blue': {
          light: '#F5FAFE',
          DEFAULT: '#336699',
          dark: '#2366A8',
        },
        'discuz-gray': {
          light: '#F5F5F5', // 页面背景
          DEFAULT: '#E5EDF2', // 边框和分隔线
          dark: '#666666', // 次要文字
        },
        'discuz-foreground': '#333333', // 主要文字
        'discuz-link': '#0066CC',

        // shadcn/ui 颜色变量映射
        border: "var(--discuz-border)",
        input: "var(--discuz-border)",
        ring: "var(--discuz-blue-dark)",
        background: "var(--discuz-background)",
        foreground: "var(--discuz-foreground)",
        primary: {
          DEFAULT: "var(--discuz-primary)",
          foreground: "var(--discuz-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--discuz-secondary)",
          foreground: "var(--discuz-secondary-foreground)",
        },
      },
      fontFamily: {
        sans: ["Tahoma", "Arial", "Helvetica", "sans-serif", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "2px",
        md: "2px",
        sm: "2px",
      },
      boxShadow: {
        'discuz': '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
