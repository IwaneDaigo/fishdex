import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#08111f",
        kelp: "#1f8f7d",
        coral: "#ff6f61",
        foam: "#f2fbff",
        reef: "#ffd166"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(6, 23, 44, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
