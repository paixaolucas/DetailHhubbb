/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Detailer'HUB brand colors — Teal Dark
        detailhub: {
          50:  "#E6F4F7",
          100: "#CCE9EF",
          200: "#99D3DF",
          300: "#66BDCF",
          400: "#33A7BF",
          500: "#007A99",
          600: "#006079",
          700: "#004D61",
          800: "#003A49",
          900: "#002731",
          950: "#001419",
        },
        // chrome — dark neutral scale
        chrome: {
          50:  "#1A1A1A",
          100: "#222222",
          200: "#2A2A2A",
          300: "#333333",
          400: "#555555",
          500: "#777777",
          600: "#999999",
          700: "#BBBBBB",
          800: "#DDDDDD",
          900: "#EEE6E4",
          950: "#F5F0EE",
        },
        // Hub alias — mirrors detailhub
        hub: {
          50:  "#E6F4F7",
          100: "#CCE9EF",
          200: "#99D3DF",
          300: "#66BDCF",
          400: "#33A7BF",
          500: "#007A99",
          600: "#006079",
          700: "#004D61",
          800: "#003A49",
          900: "#002731",
          950: "#001419",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Titillium Web", "system-ui", "sans-serif"],
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
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 96, 121, 0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(0, 96, 121, 0.25)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6", filter: "blur(1px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
      backgroundImage: {
        "detailhub-gradient": "linear-gradient(135deg, #006079, #007A99, #009CD9)",
        "chrome-gradient": "linear-gradient(135deg, #222222, #2A2A2A, #333333)",
        "dark-gradient": "linear-gradient(180deg, #1A1A1A 0%, #222222 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
