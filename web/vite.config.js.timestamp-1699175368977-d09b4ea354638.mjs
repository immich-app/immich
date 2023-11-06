// vite.config.js
import { sveltekit } from "file:///usr/src/app/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import path from "path";
var config = {
  resolve: {
    alias: {
      "xmlhttprequest-ssl": "./node_modules/engine.io-client/lib/xmlhttprequest.js",
      "@api": path.resolve("./src/api")
    }
  },
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      "/api": {
        target: process.env.PUBLIC_IMMICH_SERVER_URL,
        secure: true,
        changeOrigin: true,
        logLevel: "debug",
        rewrite: (path2) => path2.replace(/^\/api/, ""),
        ws: true
      }
    }
  },
  plugins: [sveltekit()],
  optimizeDeps: {
    entries: ["src/**/*.{svelte, ts, html}"]
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdXNyL3NyYy9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi91c3Ivc3JjL2FwcC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vdXNyL3NyYy9hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ30gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAneG1saHR0cHJlcXVlc3Qtc3NsJzogJy4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvbGliL3htbGh0dHByZXF1ZXN0LmpzJyxcbiAgICAgICdAYXBpJzogcGF0aC5yZXNvbHZlKCcuL3NyYy9hcGknKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICAvLyBjb25uZWN0IHRvIGEgcmVtb3RlIGJhY2tlbmQgZHVyaW5nIHdlYi1vbmx5IGRldmVsb3BtZW50XG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LlBVQkxJQ19JTU1JQ0hfU0VSVkVSX1VSTCxcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIGxvZ0xldmVsOiAnZGVidWcnLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpLFxuICAgICAgICB3czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW3N2ZWx0ZWtpdCgpXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZW50cmllczogWydzcmMvKiovKi57c3ZlbHRlLCB0cywgaHRtbH0nXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc04sU0FBUyxpQkFBaUI7QUFDaFAsT0FBTyxVQUFVO0FBR2pCLElBQU0sU0FBUztBQUFBLEVBQ2IsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsc0JBQXNCO0FBQUEsTUFDdEIsUUFBUSxLQUFLLFFBQVEsV0FBVztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLFFBQVEsSUFBSTtBQUFBLFFBQ3BCLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFVBQVU7QUFBQSxRQUNWLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQzVDLElBQUk7QUFBQSxNQUNOO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxFQUNyQixjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsNkJBQTZCO0FBQUEsRUFDekM7QUFDRjtBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
