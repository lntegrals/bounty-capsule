module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        surface: "#0A0A0F",
        border: "#1A1A24",
        cyber: {
          cyan: "#00F0FF",
          purple: "#7000FF",
          green: "#00FFA3",
          pink: "#FF007F",
        },
        text: {
          primary: "#F0F0F5",
          muted: "#6B7280",
          faint: "#5A5A70",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        shine: "shine 3s linear infinite",
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        beam: "beam 8s ease-in-out infinite alternate",
      },
      keyframes: {
        shine: {
          from: { backgroundPosition: "200% center" },
          to: { backgroundPosition: "-200% center" },
        },
        beam: {
          "0%": { opacity: "0.3", transform: "translateY(0px)" },
          "100%": { opacity: "0.8", transform: "translateY(-20px)" },
        },
      },
    },
  },
}
