/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // GiGoFit dark theme palette
        background: "#1a1a2e",
        surface: "#16213e",
        primary: "#e94560",
        accent: "#0f3460",
        text: "#eaeaea",
        "text-muted": "#8a8a9a",
      },
      fontFamily: {
        mono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
