import { defineApplicationConfig } from '@vben/vite-config';
import { loadEnv } from 'vite';
const env = loadEnv(process.env.NODE_ENV || '', process.cwd());
export default defineApplicationConfig({
  overrides: {
    clearScreen: false,
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'qrcode',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/locale/en_US',
      ],
    },
    server: {
      port: Number(env.VITE_PORT),
      proxy: {
        '/basic-api': {
          target: 'http://localhost:8080',
          // target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/basic-api`), ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req: any) => {
              // 自动移除无用大 Cookie，防止请求头超出 431 限制
              proxyReq.removeHeader('cookie');
              // 透传真实访问者的客户端 IP (跨机器访问时准确传递)
              const remoteIp = req?.socket?.remoteAddress || req?.headers?.['x-forwarded-for'];
              if (remoteIp) {
                proxyReq.setHeader('x-real-ip', remoteIp);
                proxyReq.setHeader('x-forwarded-for', remoteIp);
              }
            });
          },
          // only https
          // secure: false
        },
        '/upload': {
          target: 'http://localhost:3300/upload',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/upload`), ''),
        },
      },
      open: env.VITE_OPEN === 'true', // 项目启动后，自动打开
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 1. 如果你使用的是较新的 sass，指定使用现代编译器（或者直接配置 silenceDeprecations）
          api: 'modern-compiler', 
          
          // 2. 明确忽略 legacy-js-api（旧API）和 import（@import语法）的弃用警告
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin'],
          
          // 3. 忽略第三方依赖包（node_modules）里的 sass 警告
          quietDeps: true,
        },
      },
    }
  },
  
});
