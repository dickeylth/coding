import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import copy from 'rollup-plugin-copy'
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import vitePluginImp from 'vite-plugin-imp';
const prefix = `monaco-editor/esm/vs`;
import { VitePWA } from 'vite-plugin-pwa';

// 收集内置的 node_modules
function createBuiltinModules(modules: string[]) {
  const nodeModulesDir = path.join(__dirname, 'node_modules');
  const moduleDirs = fs.readdirSync(nodeModulesDir, {
    withFileTypes: true,
  }).filter(i => i.isDirectory()).map(i => i.name);
  const result: Record<string, Object> = {};
  for (let mod of modules) {
    const assets = glob.sync('**/*\.@(js|ts|jsx|tsx|css|sass|scss|less|json)', {
      cwd: path.join(nodeModulesDir, mod),
    });
    for (let asset of assets) {
      result[path.join('node_modules', mod, asset)] = fs.readFileSync(
        path.join(nodeModulesDir, mod, asset), 'utf-8');
    }
  }
  return result;
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  define: {
    PREBUILTIN_NODE_MODULES: JSON.stringify(createBuiltinModules([
      // 需要内置到文件系统 node_modules 的包
    ])),
  },
  // https://gist.github.com/FbN/0e651105937c8000f10fefdf9ec9af3d
  resolve: {
    alias: {
      process: "process/browser",
      path: 'path-browserify',
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: 'util'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    }
  },
  build: {
    // minify: false,
    commonjsOptions: {
      exclude: ['buffer']
    },
    rollupOptions: {
      input: Object.assign({
        main: path.resolve(__dirname, 'index.html'),
      }, ['mvp', 'ide']
        .map(i => [i, path.resolve(__dirname, `${i}/index.html`)])
        .reduce((ret, item) => ({
          ...ret,
          [item[0]]: item[1]
        }), {}),
      ),
      output: {
        manualChunks: {
          jsonWorker: [`${prefix}/language/json/json.worker`],
          cssWorker: [`${prefix}/language/css/css.worker`],
          htmlWorker: [`${prefix}/language/html/html.worker`],
          tsWorker: [`${prefix}/language/typescript/ts.worker`],
          editorWorker: [`${prefix}/editor/editor.worker`],
        },
      },
      plugins: [copy({
        targets: [{
          src: 'esm',
          dest: 'dist/',
        }],
        // https://github.com/vitejs/vite/issues/1231#issuecomment-753549857
        hook: 'writeBundle' // notice here
      })]
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: '@root-entry-name: default;',
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/edith-eco/coding-app/',
      scope: '/edith-eco/coding-app/',
      workbox: {
        // 默认只缓存 2M，提高到 20M
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 20,
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    vitePluginImp({
      optimize: true,
      libList: [
        {
          libName: 'antd',
          libDirectory: 'es',
          style: (name) => `antd/es/${name}/style`
        }
      ]
    })
  ]
}))
