import { build } from './esbuild';
import { ensureAbsolutePath } from './utils/path';
import type { Plugin, BuildOptions, BuildResult } from 'esbuild';
import { pluginMemfs } from './plugins/memfs';
// import { pluginNodePolyfill } from './plugins/node-polyfill';
// import debounce from 'debounce';
import { pluginBareModule } from './plugins/bare';
// import type chokidar from 'chokidar';
import { CompilerOptions } from './types';
import { pluginHttp } from './plugins/http';
import { pluginUnpkg } from './plugins/unpkg';
import path from 'path';
import fs from 'fs';
import { pluginEntry } from './plugins/entry';
// import { sassPlugin } from 'esbuild-sass-plugin';
import { pluginSass } from './plugins/sass';

// import { pluginGlobalExternal } from '../plugins/external-global';
function normalizeOptions(options: CompilerOptions): Required<CompilerOptions> {
  const cwd = options.cwd ?? process.cwd();
  return {
    input: ensureAbsolutePath(options.input, cwd),
    output: ensureAbsolutePath(options.output ?? 'dist.js', cwd),
    fileSystem: options.fileSystem ?? fs,
    unpkg: options.unpkg ?? false,
    watch: options.watch ?? false,
    plugins: options.plugins ?? [],
    hooks: options.hooks ?? {},
    cwd,
    platform: options.platform ?? 'node',
    format: options.format ?? 'cjs',
    memfs: options.memfs ?? false,
    http: options.http ?? false,
  };
}

const defaultEsbuildOptions: BuildOptions = {
  platform: 'node',
  logLevel: 'error',
  bundle: true,
  plugins: [],
  external: ['fsevents'],
};

function normalizeEsbuildOptions(options: BuildOptions) {
  const ret = {
    ...defaultEsbuildOptions,
    ...options,
  };
  return ret;
}

export class Compiler {
  options: Required<CompilerOptions>;
  result: BuildResult | undefined;
  // watcher?: chokidar.FSWatcher;
  firstBuildPass = false;
  constructor(options: CompilerOptions) {
    this.options = normalizeOptions(options);
  }
  async build() {
    // const context = this;
    this.options.hooks?.start?.();
    try {
      const context = this;
      if (this.result) {
        this.result = await this.result?.rebuild?.();
      } else {
        const result = await build(
          normalizeEsbuildOptions({
            entryPoints: ['<stdin>'],
            incremental: true,
            logLevel: 'error',
            write: !context.options.memfs,
            outfile: this.options.output,
            format: context.options.format,
            globalName: 'bundler',
            define: {
              __NODE__: JSON.stringify(context.options.platform === 'node'),
              // 避免 process.env.NODE_ENV 被替换
              [['process', 'env', 'NODE_ENV'].join('.')]: JSON.stringify(process.env.NODE_ENV || 'production'),
            },
            external:
              this.options.platform === 'node' ? ['esbuild', 'fsevents'] : ['esbuild', 'fsevents', 'chokidar', 'yargs'],
            platform: this.options.platform,
            banner: {
              // js: 'global = globalThis'
            },
            // inject: [path.join(__dirname, '../shim/node.js')],
            plugins: [
              // pluginNodePolyfill(),
              // context.options.platform === 'browser' && pluginGlobalExternal(),
              pluginEntry(context),
              pluginBareModule(context),
              pluginSass(context),
              context.options.http && pluginHttp(),
              context.options.unpkg && pluginUnpkg(context),
              context.options.memfs && pluginMemfs(context),
              // sassPlugin({
              //   cssImports: true,
              // }),
            ].filter(Boolean) as Plugin[],
          })
        );
        this.result = result;
      }
      if (context.options.memfs) {
        this.result?.outputFiles?.forEach((x) => {
          if (!context.options.fileSystem.existsSync(path.dirname(x.path))) {
            context.options.fileSystem.mkdirSync(path.dirname(x.path));
          }
          context.options.fileSystem.writeFileSync(x.path, x.text);
        });
      }
      // this.hooks.done.promise(this.result);
      this.options?.hooks?.done?.(this.result!);
    } finally {
      this.firstBuildPass = true;
    }
  }
}

