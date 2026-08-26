import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };

  const googleMapsEnvDefine = {
    "import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY": JSON.stringify(
      env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ?? env.GOOGLE_MAPS_BROWSER_KEY ?? "",
    ),
    "import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID": JSON.stringify(
      env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID ?? env.GOOGLE_MAPS_TRACKING_ID ?? "",
    ),
  };

  return {
    define: googleMapsEnvDefine,
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart(),
      nitro({ preset: "vercel" }),
      viteReact(),
    ],
    build: {
      rollupOptions: {
        external: ["cloudflare:workers"],
      },
    },
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});