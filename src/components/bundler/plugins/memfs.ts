import { Plugin } from 'esbuild';
import { Compiler } from '..';
import path from 'path';
import { FileSystem } from '../types';
import { extToLoader } from '../utils';
import { SASS_REGEXP, SassNamespace } from './sass';
export const MemfsNamespace = 'memfsNZ';
function resolve({ id, importer, fs }: { id: string; importer: string; fs: FileSystem }) {
  let resolvedPath = id;
  if (importer && id.startsWith('.')) {
    resolvedPath = path.resolve(path.dirname(importer), id);
  }
  for (const x of ['', '.ts', '.tsx', '.js', '.jsx', '.json', '.css',]) {
    const realPath = resolvedPath + x;
    if (fs.existsSync(realPath)) {
      return realPath;
    }
  }
  throw new Error(`${resolvedPath} not exists`);
}


export const pluginMemfs = (context: Compiler): Plugin => {
  return {
    name: 'memfs-plugin',
    setup(build) {
      build.onResolve({ filter: /.*/, namespace: MemfsNamespace }, (args) => {
        console.log(`memfs resolve ${args.path}...`);
        if (SASS_REGEXP.test(args.path)) {
          return {
            path: args.path,
            namespace: SassNamespace,
          };
        }
        return {
          path: args.path,
          pluginData: args.pluginData,
          namespace: MemfsNamespace,
        };
      });
      build.onLoad({ filter: /.*/, namespace: MemfsNamespace }, async (args) => {
        let realPath = args.path;
        const resolvePath = resolve({
          id: args.path,
          importer: args.pluginData.importer,
          fs: context.options.fileSystem,
        });
        console.log(`memfs load ${args.path} to ${resolvePath}`);
        if (!resolvePath) {
          throw new Error('not found');
        }
        realPath = resolvePath;
        const contents = (await context.options.fileSystem.promises.readFile(realPath)).toString();
        const extName = path.extname(realPath).slice(1) as string;
        const loader = extToLoader(extName) as any;
        if (loader) {
          return {
            contents,
            pluginData: {
              importer: realPath,
            },
            loader: extToLoader(extName) as any,
          };
        }
      });
    },
  };
};
