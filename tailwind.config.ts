import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'zytech-bg': '#ffffff',
        'zytech-sidebar': '#f8fafc',
        'zytech-darkbg': '#050515',
        'zytech-darksidebar': '#0a0b22',
        'zytech-yellow': '#F59E0B',
        'zytech-pink': '#EC4899',
        'zytech-purple': '#8B5CF6',
        'zytech-indigo': '#6366F1',
      },
    },
  },
  plugins: [],
};
export default config;
