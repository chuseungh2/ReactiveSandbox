import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves at https://<user>.github.io/<repo>/, so the
// `base` URL needs the repo prefix in production. Setting it to "./"
// makes assets resolve relative to index.html — works for both
// project pages (user.github.io/project-exodus/) and any local
// preview, with no need to hardcode the username.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
