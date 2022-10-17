/**
 * fork from https://github.com/hardfist/neo-tools/blob/main/packages/bundler/src/lib/compiler.ts
 */
import {
  BuildOptions, BuildResult, PluginBuild, TransformOptions, TransformResult
} from 'esbuild';
import { version } from 'esbuild-wasm/package.json';
import esbuild from 'esbuild-wasm/esm/browser';

const esbuildInitPromise = esbuild.initialize({
  wasmURL: process.env.NODE_ENV === 'production' ?
    `https://unpkg.alibaba-inc.com/esbuild-wasm@${version}/esbuild.wasm` :
    '/node_modules/esbuild-wasm/esbuild.wasm',
});


const getService = async (): Promise<PluginBuild['esbuild']> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const esbuild = await import('esbuild-wasm/esm/browser');

  // const service = await esbuild.startService({
  //   worker: true,
  //   wasmURL: `https://unpkg.alibaba-inc.com/esbuild-wasm@${version}/esbuild.wasm`,
  // });
  await esbuildInitPromise;
  return esbuild;
};

const wasmBuild = async (options: BuildOptions): Promise<BuildResult> => {
  const service = await getService();
  try {
    return service.build(options);
  } finally {
    //service.stop();
  }
};

const wasmTransform = async (input: string, options: TransformOptions): Promise<TransformResult> => {
  const service = await getService();
  try {
    return service.transform(input, options);
  } finally {
    // service.stop();
  }
};

const build = wasmBuild;

const transform: typeof import('esbuild').transform = wasmTransform;

export { build, transform };
