import { Loader, Plugin } from 'esbuild';
import { resolve, dirname, extname } from 'path';
import { Compiler } from '../compiler';
import { extToLoader } from '../utils';
import { fetchPkg } from './http';
import { SASS_REGEXP, SassNamespace, SASS_PLUGIN_NAME, loadSass } from './sass';
export const UnpkgNamepsace = 'unpkg';
export const UnpkgHost = 'https://unpkg.com/';
const cache: Record<string, Awaited<ReturnType<typeof fetchPkg>>> = {};

export const pluginUnpkg = (context: Compiler): Plugin => {
  return {
    name: 'unpkg',
    setup(build) {
      build.onLoad({ namespace: UnpkgNamepsace, filter: /.*/ }, async (args) => {
        const pathUrlObj = new URL(args.path, args.pluginData.parentUrl);
        const pathUrl = pathUrlObj.toString();
        let value = cache[pathUrl];
        if (!value) {
          value = await fetchPkg(pathUrl);
        }
        if (value.statusCode === 200) {
          cache[pathUrl] = value;

          console.log(`load ${args.path} from unpkg: ${pathUrl} -> ${value.url}`);

          if (SASS_REGEXP.test(value.url)) {
            return loadSass({
              ...args,
              namespace: SassNamespace,
              pluginData: {
                parentUrl: value.url,
                source: value.content,
              }
            });
          }

          return {
            contents: value.content,
            loader: extToLoader(extname(value.url)) as Loader,
            pluginData: {
              parentUrl: value.url,
            },
          };
        } else {
          // 尝试查找 package.json
          const pkgJsonUrl = [
            pathUrl.replace(/\/$/, ''), 'package.json'
          ].join('/');
          const pkgJsonResult = await fetchPkg(pkgJsonUrl);
          if (pkgJsonResult.statusCode === 200) {
            const pkgJsonObject = JSON.parse(pkgJsonResult.content);
            // mainFields，module 优先，其次 main
            const entry = pkgJsonObject.module || pkgJsonObject.main;
            if (entry) {
              const entryRealPath = resolve(pathUrlObj.pathname, entry);
              const entryUrlObj = new URL(pathUrl);
              entryUrlObj.pathname = entryRealPath;
              const entryResult = await fetchPkg(entryUrlObj.toString());
              console.log(`load ${args.path} from package.json entry: ${entryUrlObj.toString()}`);
              if (entryResult.statusCode === 200) {
                return {
                  contents: entryResult.content,
                  pluginData: {
                    parentUrl: entryResult.url,
                  },
                }
              }
            }
          }
        }
      });
      build.onResolve({ namespace: UnpkgNamepsace, filter: /.*/ }, async (args) => {
        console.log(`unpkg resolve ${args.path}...`);
        return {
          namespace: UnpkgNamepsace,
          path: args.path,
          pluginData: args.pluginData,
        };
      });
    },
  };
};
