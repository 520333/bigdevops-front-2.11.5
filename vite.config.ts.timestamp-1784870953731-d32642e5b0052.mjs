// vite.config.ts
import { defineApplicationConfig } from "file:///E:/go-project/vben-tp/big-devops-ok2.11.5/internal/vite-config/dist/index.mjs";
import { loadEnv } from "file:///E:/go-project/vben-tp/big-devops-ok2.11.5/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.43_less@4.6.7_sass@1.101.0_terser@5.49.0/node_modules/vite/dist/node/index.js";
var env = loadEnv(process.env.NODE_ENV || "", process.cwd());
var vite_config_default = defineApplicationConfig({
  overrides: {
    clearScreen: false,
    optimizeDeps: {
      include: [
        "echarts/core",
        "echarts/charts",
        "echarts/components",
        "echarts/renderers",
        "qrcode",
        "@iconify/iconify",
        "ant-design-vue/es/locale/zh_CN",
        "ant-design-vue/es/locale/en_US"
      ]
    },
    server: {
      port: Number(env.VITE_PORT),
      proxy: {
        "/basic-api": {
          target: "http://localhost:8080",
          // target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/basic-api`), "")
          // only https
          // secure: false
        },
        "/upload": {
          target: "http://localhost:3300/upload",
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/upload`), "")
        }
      },
      open: env.VITE_OPEN === "true",
      // 项目启动后，自动打开
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 1. 如果你使用的是较新的 sass，指定使用现代编译器（或者直接配置 silenceDeprecations）
          api: "modern-compiler",
          // 2. 明确忽略 legacy-js-api（旧API）和 import（@import语法）的弃用警告
          silenceDeprecations: ["legacy-js-api", "import", "global-builtin"],
          // 3. 忽略第三方依赖包（node_modules）里的 sass 警告
          quietDeps: true
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnby1wcm9qZWN0XFxcXHZiZW4tdHBcXFxcYmlnLWRldm9wcy1vazIuMTEuNVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ28tcHJvamVjdFxcXFx2YmVuLXRwXFxcXGJpZy1kZXZvcHMtb2syLjExLjVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2dvLXByb2plY3QvdmJlbi10cC9iaWctZGV2b3BzLW9rMi4xMS41L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQXBwbGljYXRpb25Db25maWcgfSBmcm9tICdAdmJlbi92aXRlLWNvbmZpZyc7XG5pbXBvcnQgeyBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5jb25zdCBlbnYgPSBsb2FkRW52KHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICcnLCBwcm9jZXNzLmN3ZCgpKTtcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUFwcGxpY2F0aW9uQ29uZmlnKHtcbiAgb3ZlcnJpZGVzOiB7XG4gICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAnZWNoYXJ0cy9jb3JlJyxcbiAgICAgICAgJ2VjaGFydHMvY2hhcnRzJyxcbiAgICAgICAgJ2VjaGFydHMvY29tcG9uZW50cycsXG4gICAgICAgICdlY2hhcnRzL3JlbmRlcmVycycsXG4gICAgICAgICdxcmNvZGUnLFxuICAgICAgICAnQGljb25pZnkvaWNvbmlmeScsXG4gICAgICAgICdhbnQtZGVzaWduLXZ1ZS9lcy9sb2NhbGUvemhfQ04nLFxuICAgICAgICAnYW50LWRlc2lnbi12dWUvZXMvbG9jYWxlL2VuX1VTJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IE51bWJlcihlbnYuVklURV9QT1JUKSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYmFzaWMtYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsXG4gICAgICAgICAgLy8gdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgd3M6IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZShuZXcgUmVnRXhwKGBeL2Jhc2ljLWFwaWApLCAnJyksXG4gICAgICAgICAgLy8gb25seSBodHRwc1xuICAgICAgICAgIC8vIHNlY3VyZTogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgJy91cGxvYWQnOiB7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMzAwL3VwbG9hZCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHdzOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UobmV3IFJlZ0V4cChgXi91cGxvYWRgKSwgJycpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9wZW46IGVudi5WSVRFX09QRU4gPT09ICd0cnVlJywgLy8gXHU5ODc5XHU3NkVFXHU1NDJGXHU1MkE4XHU1NDBFXHVGRjBDXHU4MUVBXHU1MkE4XHU2MjUzXHU1RjAwXG4gICAgICB3YXJtdXA6IHtcbiAgICAgICAgY2xpZW50RmlsZXM6IFsnLi9pbmRleC5odG1sJywgJy4vc3JjL3t2aWV3cyxjb21wb25lbnRzfS8qJ10sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY3NzOiB7XG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICAgIHNjc3M6IHtcbiAgICAgICAgICAvLyAxLiBcdTU5ODJcdTY3OUNcdTRGNjBcdTRGN0ZcdTc1MjhcdTc2ODRcdTY2MkZcdThGODNcdTY1QjBcdTc2ODQgc2Fzc1x1RkYwQ1x1NjMwN1x1NUI5QVx1NEY3Rlx1NzUyOFx1NzNCMFx1NEVFM1x1N0YxNlx1OEJEMVx1NTY2OFx1RkYwOFx1NjIxNlx1ODAwNVx1NzZGNFx1NjNBNVx1OTE0RFx1N0Y2RSBzaWxlbmNlRGVwcmVjYXRpb25zXHVGRjA5XG4gICAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJywgXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gMi4gXHU2NjBFXHU3ODZFXHU1RkZEXHU3NTY1IGxlZ2FjeS1qcy1hcGlcdUZGMDhcdTY1RTdBUElcdUZGMDlcdTU0OEMgaW1wb3J0XHVGRjA4QGltcG9ydFx1OEJFRFx1NkNENVx1RkYwOVx1NzY4NFx1NUYwM1x1NzUyOFx1OEI2Nlx1NTQ0QVxuICAgICAgICAgIHNpbGVuY2VEZXByZWNhdGlvbnM6IFsnbGVnYWN5LWpzLWFwaScsICdpbXBvcnQnLCAnZ2xvYmFsLWJ1aWx0aW4nXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyAzLiBcdTVGRkRcdTc1NjVcdTdCMkNcdTRFMDlcdTY1QjlcdTRGOURcdThENTZcdTUzMDVcdUZGMDhub2RlX21vZHVsZXNcdUZGMDlcdTkxQ0NcdTc2ODQgc2FzcyBcdThCNjZcdTU0NEFcbiAgICAgICAgICBxdWlldERlcHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH1cbiAgfSxcbiAgXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVQsU0FBUywrQkFBK0I7QUFDN1YsU0FBUyxlQUFlO0FBQ3hCLElBQU0sTUFBTSxRQUFRLFFBQVEsSUFBSSxZQUFZLElBQUksUUFBUSxJQUFJLENBQUM7QUFDN0QsSUFBTyxzQkFBUSx3QkFBd0I7QUFBQSxFQUNyQyxXQUFXO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTSxPQUFPLElBQUksU0FBUztBQUFBLE1BQzFCLE9BQU87QUFBQSxRQUNMLGNBQWM7QUFBQSxVQUNaLFFBQVE7QUFBQTtBQUFBLFVBRVIsY0FBYztBQUFBLFVBQ2QsSUFBSTtBQUFBLFVBQ0osU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBTyxhQUFhLEdBQUcsRUFBRTtBQUFBO0FBQUE7QUFBQSxRQUcvRDtBQUFBLFFBQ0EsV0FBVztBQUFBLFVBQ1QsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsSUFBSTtBQUFBLFVBQ0osU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBTyxVQUFVLEdBQUcsRUFBRTtBQUFBLFFBQzVEO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTSxJQUFJLGNBQWM7QUFBQTtBQUFBLE1BQ3hCLFFBQVE7QUFBQSxRQUNOLGFBQWEsQ0FBQyxnQkFBZ0IsNEJBQTRCO0FBQUEsTUFDNUQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxxQkFBcUI7QUFBQSxRQUNuQixNQUFNO0FBQUE7QUFBQSxVQUVKLEtBQUs7QUFBQTtBQUFBLFVBR0wscUJBQXFCLENBQUMsaUJBQWlCLFVBQVUsZ0JBQWdCO0FBQUE7QUFBQSxVQUdqRSxXQUFXO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
