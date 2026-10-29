import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5190,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
  },
})