// vite.config.js
import { enhancedImages } from "file:///home/alex/immich/web/node_modules/@sveltejs/enhanced-img/src/index.js";
import { sveltekit } from "file:///home/alex/immich/web/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import path from "node:path";
import { visualizer } from "file:///home/alex/immich/web/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { defineConfig } from "file:///home/alex/immich/web/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/home/alex/immich/web";
var upstream = {
  target: process.env.IMMICH_SERVER_URL || "http://immich-server:3001/",
  secure: true,
  changeOrigin: true,
  logLevel: "info",
  ws: true
};
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "xmlhttprequest-ssl": "./node_modules/engine.io-client/lib/xmlhttprequest.js",
      // eslint-disable-next-line unicorn/prefer-module
      "@test-data": path.resolve(__vite_injected_original_dirname, "./src/test-data")
    }
  },
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      "/api": upstream,
      "/.well-known/immich": upstream,
      "/custom.css": upstream
    }
  },
  plugins: [
    sveltekit(),
    process.env.BUILD_STATS === "true" ? visualizer({
      emitFile: true,
      filename: "stats.html"
    }) : void 0,
    enhancedImages()
  ],
  optimizeDeps: {
    entries: ["src/**/*.{svelte,ts,html}"]
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-data/setup.ts"],
    sequence: {
      hooks: "list"
    },
    alias: [{ find: /^svelte$/, replacement: "svelte/internal" }]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9hbGV4L2ltbWljaC93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2FsZXgvaW1taWNoL3dlYi92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9hbGV4L2ltbWljaC93ZWIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBlbmhhbmNlZEltYWdlcyB9IGZyb20gJ0BzdmVsdGVqcy9lbmhhbmNlZC1pbWcnO1xuaW1wb3J0IHsgc3ZlbHRla2l0IH0gZnJvbSAnQHN2ZWx0ZWpzL2tpdC92aXRlJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuXG5jb25zdCB1cHN0cmVhbSA9IHtcbiAgdGFyZ2V0OiBwcm9jZXNzLmVudi5JTU1JQ0hfU0VSVkVSX1VSTCB8fCAnaHR0cDovL2ltbWljaC1zZXJ2ZXI6MzAwMS8nLFxuICBzZWN1cmU6IHRydWUsXG4gIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgbG9nTGV2ZWw6ICdpbmZvJyxcbiAgd3M6IHRydWUsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICd4bWxodHRwcmVxdWVzdC1zc2wnOiAnLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9saWIveG1saHR0cHJlcXVlc3QuanMnLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLW1vZHVsZVxuICAgICAgJ0B0ZXN0LWRhdGEnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvdGVzdC1kYXRhJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgLy8gY29ubmVjdCB0byBhIHJlbW90ZSBiYWNrZW5kIGR1cmluZyB3ZWItb25seSBkZXZlbG9wbWVudFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHVwc3RyZWFtLFxuICAgICAgJy8ud2VsbC1rbm93bi9pbW1pY2gnOiB1cHN0cmVhbSxcbiAgICAgICcvY3VzdG9tLmNzcyc6IHVwc3RyZWFtLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGVraXQoKSxcbiAgICBwcm9jZXNzLmVudi5CVUlMRF9TVEFUUyA9PT0gJ3RydWUnXG4gICAgICA/IHZpc3VhbGl6ZXIoe1xuICAgICAgICAgIGVtaXRGaWxlOiB0cnVlLFxuICAgICAgICAgIGZpbGVuYW1lOiAnc3RhdHMuaHRtbCcsXG4gICAgICAgIH0pXG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICBlbmhhbmNlZEltYWdlcygpLFxuICBdLFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBlbnRyaWVzOiBbJ3NyYy8qKi8qLntzdmVsdGUsdHMsaHRtbH0nXSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLHRzfSddLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0LWRhdGEvc2V0dXAudHMnXSxcbiAgICBzZXF1ZW5jZToge1xuICAgICAgaG9va3M6ICdsaXN0JyxcbiAgICB9LFxuICAgIGFsaWFzOiBbeyBmaW5kOiAvXnN2ZWx0ZSQvLCByZXBsYWNlbWVudDogJ3N2ZWx0ZS9pbnRlcm5hbCcgfV0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVAsU0FBUyxzQkFBc0I7QUFDaFIsU0FBUyxpQkFBaUI7QUFDMUIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsb0JBQW9CO0FBSjdCLElBQU0sbUNBQW1DO0FBTXpDLElBQU0sV0FBVztBQUFBLEVBQ2YsUUFBUSxRQUFRLElBQUkscUJBQXFCO0FBQUEsRUFDekMsUUFBUTtBQUFBLEVBQ1IsY0FBYztBQUFBLEVBQ2QsVUFBVTtBQUFBLEVBQ1YsSUFBSTtBQUNOO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsc0JBQXNCO0FBQUE7QUFBQSxNQUV0QixjQUFjLEtBQUssUUFBUSxrQ0FBVyxpQkFBaUI7QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQTtBQUFBLElBRU4sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsUUFBUSxJQUFJLGdCQUFnQixTQUN4QixXQUFXO0FBQUEsTUFDVCxVQUFVO0FBQUEsTUFDVixVQUFVO0FBQUEsSUFDWixDQUFDLElBQ0Q7QUFBQSxJQUNKLGVBQWU7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLDJCQUEyQjtBQUFBLEVBQ3ZDO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTLENBQUMsOEJBQThCO0FBQUEsSUFDeEMsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLDBCQUEwQjtBQUFBLElBQ3ZDLFVBQVU7QUFBQSxNQUNSLE9BQU87QUFBQSxJQUNUO0FBQUEsSUFDQSxPQUFPLENBQUMsRUFBRSxNQUFNLFlBQVksYUFBYSxrQkFBa0IsQ0FBQztBQUFBLEVBQzlEO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
