import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["motion/react"],
  },
  ssr: {
    noExternal: ["motion"],
  },
});
