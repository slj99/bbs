import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode, command, isSsrBuild, isPreview }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      plugins: [
        cloudflare({ viteEnvironment: { name: "ssr" } }),
      ],
    },
    // 配置开发服务器代理，将 /api 请求转发到 wrangler dev 运行的 worker
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        }
      }
    }
  };
})
