import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { handleMentorRequest } from "./server/mentorHttp.js";

function mentorApiDev(): Plugin {
  return {
    name: "mentor-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/mentor", (req, res, next) => {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        void handleMentorRequest(req, res, env.OPENAI_API_KEY).catch(next);
      });
    },
  };
}

// ZaLife Daily OS 2.0 - desktop-first PWA build configuration.
export default defineConfig({
  plugins: [
    react(),
    mentorApiDev(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png"],
      manifest: {
        name: "ZaLife DailyOS",
        short_name: "ZaLife DailyOS",
        description:
          "Gamificiran produktivnostni kokpit za mlade voditelje - ZaLife Leadership Bootcamp.",
        lang: "sl",
        theme_color: "#EFA73B",
        background_color: "#15171C",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          {
            src: "logo.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
