## Coding

> In-browser lightweight front-end coding & bundle & preview demo, forked from <https://github.com/hardfist/neo-tools>

> 一个轻量级的纯浏览器环境的前端 IDE demo，支持打包和预览，基于 esbuild-wasm & browser-dart-sass。

## 访问

<https://coding-three.vercel.app>

## 代码

```

coding on  main [?] via  v16.18.0
❯ tree -I node_modules -I dist
.
├── README.md
├── ide                           // IDE entry
│   ├── index.css
│   ├── index.html
│   └── main.tsx
├── index.html
├── mvp                           // Minimum Viable Product
│   ├── index.css
│   ├── index.html
│   └── main.tsx
├── package.json
├── packages
│   └── browser-dart-sass         // dart-sass in browser, forked from https://github.com/codesandbox/codesandbox-client/blob/master/packages/browser-dart-sass
│       ├── index.js
│       ├── input.js
│       ├── lib
│       │   └── index.js
│       ├── package.json
│       └── prelude.js
├── src
│   ├── components
│   │   ├── DeviceSimulator
│   │   │   ├── index.less
│   │   │   └── index.tsx
│   │   ├── NotFound
│   │   │   └── index.tsx
│   │   ├── Portal
│   │   │   └── index.tsx
│   │   └── bundler                       // online bundler 组件实现
│   │       ├── compiler.ts
│   │       ├── esbuild.ts
│   │       ├── index.ts
│   │       ├── plugins                   // esbuild 插件列表
│   │       │   ├── bare.ts
│   │       │   ├── entry.ts
│   │       │   ├── http.ts
│   │       │   ├── memfs.ts
│   │       │   ├── node-polyfill.ts
│   │       │   ├── sass.ts
│   │       │   └── unpkg.ts
│   │       ├── shim
│   │       │   ├── node.js
│   │       │   ├── polyfills.ts
│   │       │   └── process.js
│   │       ├── types.ts
│   │       └── utils
│   │           ├── index.ts
│   │           └── path.ts
│   ├── favicon.svg
│   ├── index.css
│   ├── logo.svg
│   ├── main.tsx
│   ├── utils
│   │   └── request.ts
│   ├── views
│   │   ├── ide
│   │   │   ├── constants.ts
│   │   │   ├── index.less
│   │   │   ├── index.tsx
│   │   │   ├── preview
│   │   │   │   └── index.html
│   │   │   └── utils
│   │   │       └── syncTsLib.ts
│   │   └── mvp
│   │       ├── index.tsx
│   │       └── preview
│   │           └── index.html
│   └── vite-env.d.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

21 directories, 50 files
```
