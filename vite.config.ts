import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');
  const hasUrl = Boolean(env.VITE_SUPABASE_URL?.trim());
  const hasKey = Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim());
  if (command === 'build') {
    console.info(`[Supabase config] URL configured: ${hasUrl}; public key configured: ${hasKey}`);
    const missing: string[] = [];
    if (!hasUrl) missing.push('VITE_SUPABASE_URL');
    if (!hasKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)');
    if (missing.length) {
      throw new Error(`Missing Supabase build environment variables: ${missing.join(', ')}. Check this deployment's Vercel project, Preview scope and branch overrides.`);
    }
  }
  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
