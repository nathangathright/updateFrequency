import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const pagesBase = "/updateFrequency/";
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: isGitHubPagesBuild ? pagesBase : "/",
  plugins: [tailwindcss()],
  server: {
    open: "/index.html",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  root: "src",
});
