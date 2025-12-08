import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [fresh()],
  server: {
    port: Number(Deno.env.get("PORT_FRONTEND")) || 5173,
  },
  define: {
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
      `http://localhost:${Deno.env.get("PORT_BACKEND") || "11001"}`,
    ),
  },
});
