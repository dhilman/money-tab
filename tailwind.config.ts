import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        rounded: ["ui-rounded", "system-ui", "sans-serif"],
      },
      fontSize: {
        // == tg caption 2
        xxs: [
          "11px",
          {
            lineHeight: "13px",
            letterSpacing: "0.06px",
          },
        ],
        // == tg caption 1
        xs: [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0px",
          },
        ],
        // == tg subhealine 2
        sm: [
          "14px",
          {
            lineHeight: "18px",
            letterSpacing: "-0.15px",
          },
        ],
        // == tg body
        base: [
          "17px",
          {
            lineHeight: "22px",
            letterSpacing: "-0.42px",
            fontWeight: "400",
          },
        ],
        // == tg title 1
        lg: [
          "20px",
          {
            lineHeight: "24px",
            letterSpacing: "-0.45px",
          },
        ],
        // == tg title 2
        xl: [
          "22px",
          {
            lineHeight: "28px",
            letterSpacing: "-0.26px",
          },
        ],
        // == tg title 3
        "2xl": [
          "28px",
          {
            lineHeight: "34px",
            letterSpacing: "0.38px",
          },
        ],
      },
      colors: {
        canvas: "hsl(var(--canvas))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        hint: "hsl(var(--hint))",
        link: "hsl(var(--link))",
        border: "hsl(var(--border))",
      },
      boxShadow: {
        xs: "0 0.75px 1.5px 0 rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        rotate: {
          "0%": { transform: "rotate(0deg) scale(10)" },
          "100%": { transform: "rotate(-360deg) scale(10)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rotate: "rotate 10s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
