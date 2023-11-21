/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  important: "#date-pick",
  // corePlugins: {
  //   preflight: false,
  // },
  theme: {
    extend: {
      zIndex: {
        999999: "999999",
      },
    },
  },
  plugins: [],
};
