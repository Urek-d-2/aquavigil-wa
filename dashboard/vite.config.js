import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base = nom du repo pour GitHub Pages projet (https://<user>.github.io/aquavigil-wa/)
export default defineConfig({
  base: "/aquavigil-wa/",
  plugins: [react()],
});
