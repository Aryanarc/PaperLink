/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          bg: "#0d1117",
          panel: "#161b22",
          border: "#30363d",
          text: "#e6edf3",
          muted: "#8b949e",
          primary: "#2f81f7"
        }
      }
    },
    plugins: [],
  }