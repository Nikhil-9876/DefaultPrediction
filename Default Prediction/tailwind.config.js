module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        chatbotIn: {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.95)" },
          "60%": { opacity: "1", transform: "translateY(-6px) scale(1.02)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        chatbotOut: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(40px) scale(0.95)" },
        },
      },
      animation: {
        chatbotIn: "chatbotIn 400ms ease-out forwards",
        chatbotOut: "chatbotOut 300ms ease-in forwards",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}