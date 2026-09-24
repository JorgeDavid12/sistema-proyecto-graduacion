/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        emeraldTech: "#10f09b",
        deepGreen: "#063f32",
        graphite: "#111716",
        graphiteSoft: "#18211f",
        warmWhite: "#f6f2e8",
        cyberCyan: "#45d9ff",
        alertAmber: "#ffbe45",
      },
      boxShadow: {
        glow: "0 0 36px rgba(16, 240, 155, 0.24)",
        glass: "0 20px 60px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        "tech-radial":
          "radial-gradient(circle at 20% 20%, rgba(16,240,155,0.22), transparent 28%), radial-gradient(circle at 82% 18%, rgba(69,217,255,0.16), transparent 24%), linear-gradient(135deg, #111716 0%, #063f32 48%, #101514 100%)",
      },
      animation: {
        "float-slow": "float-slow 7s ease-in-out infinite",
        "route-dash": "route-dash 16s linear infinite",
        "soft-pulse": "soft-pulse 2.8s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "route-dash": {
          "0%": { strokeDashoffset: "420" },
          "100%": { strokeDashoffset: "0" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.65", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
