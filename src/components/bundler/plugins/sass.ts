/**
 * sass plugin
 */
import { Plugin, PluginBuild } from 'esbuild';
import { Compiler } from '..';
import path, {dirname, parse, relative, resolve, sep} from 'path';
import { extToLoader } from '../utils';
import { CompilerOptions } from '../types';
export const SassNamespace = 'sass';
export const SASS_REGEXP = /\.(s[ac]ss|css)$/;
export const SASS_PLUGIN_NAME = 'sass-plugin';
let fs: Required<CompilerOptions>['fileSystem'];
// import * as sass from '../../../../packages/browser-dart-sass';
import {ImporterResult, Syntax} from 'sass';

let libPromise = null;
async function fetchSassLibrary() {
  if (!libPromise) {
    // @ts-ignore
    libPromise = import('browser-dart-sass').then(
      x => {
        // debugger;
        return x.default;
      })
    .catch(e => {
      console.error(e);
    });
  }
  return libPromise;
}

export function pathToFileURL(path: string) {
  const url = new URL(path, 'file:');
  url.hash = encodeURIComponent(url.hash);
  return url;
}
export function fileURLToPath(fileUrl: string | URL) {
  return decodeURIComponent((typeof fileUrl === 'string' ? new URL(fileUrl) : fileUrl).pathname);
}

export function fileSyntax(filename: string): Syntax {
  if (filename.endsWith('.scss')) {
    return 'scss'
  } else if (filename.endsWith('.css')) {
    return 'css'
  } else {
    return 'indented'
  }
}

export function sourceMappingURL(sourceMap: any): string {
  const data = Buffer.from(JSON.stringify(sourceMap), 'utf-8').toString('base64')
  return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${data} */`
}


/**
 * NOTE: we're deliberately ignoring sass recommendation to avoid sacrificing speed here!
 * - we prefer fragment attempt over syntax attempt
 * - we prefer .scss and .css over .sass
 * - we don't throw exceptions if the URL is ambiguous
 */
function resolveImport(pathname: string, ext?: string): string | null {
  if (ext) {
    let filename = pathname + ext
    if (fs.existsSync(filename)) {
      return filename
    }
    const index = filename.lastIndexOf(sep)
    filename = index >= 0 ? filename.slice(0, index) + sep + '_' + filename.slice(index + 1) : '_' + filename
    if (fs.existsSync(filename)) {
      return filename
    }
    return null
  } else {
    if (!fs.existsSync(dirname(pathname))) {
      return null
    }
    return resolveImport(pathname, '.scss')
      || resolveImport(pathname, '.css')
      || resolveImport(pathname, '.sass')
      || resolveImport(pathname + sep + 'index')
  }
}

function resolveRelativeImport(loadPath: string, filename: string): string | null {
  const absolute = resolve(dirname(loadPath), filename);
  const pathParts = parse(absolute);
  if (pathParts.ext) {
    return resolveImport(pathParts.dir + sep + pathParts.name, pathParts.ext);
  } else {
    return resolveImport(absolute);
  }
}

const SassImportMap = new Map<string, {file: string, contents: string}>();

export const loadSass: Parameters<PluginBuild["onLoad"]>[1] = async (args) => {
  let realPath = args.path;
  let pluginData = args.pluginData;
  const basedir = dirname(realPath)
  const source = pluginData?.source || (await fs.promises.readFile(realPath)).toString();

  try {
    const sass = await fetchSassLibrary();
    const transpilationResult: {
      css: any;
      map: any;
      stats: any;
    } = await new Promise((resolve, reject) => {
      sass.render(
        {
          data: source,
          file: realPath,
          importer: (url: string, prev: string) => {
            if (/^http/.test(prev)) {
              prev = new URL(prev).pathname;
            }
            const key = `${url}_${prev}`;
            if (SassImportMap.has(key)) {
              return SassImportMap.get(key);
            }
            let filename;
            if (url.startsWith('~')) {
              console.log(`sass importing ${url}`);
              filename = resolveImport(path.join('node_modules', decodeURI(url.slice(1))));
            } else if (prev) {
              filename = resolveRelativeImport(prev, url);
            } else {
              filename = resolveImport(fileURLToPath(decodeURI(url)));
            }
            if (!filename) {
              throw new Error(`failed to canonicalize ${url}`);
            }
            let contents = fs.readFileSync(filename, 'utf8');
            console.log(`sass loading ${filename}`);
            const result = {
              file: filename,
              contents
            };
            SassImportMap.set(key, result);
            return result;
          },
          sourceMapEmbed: true,
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });


    let cssText = transpilationResult.css.toString();

    return {
      contents: cssText,
      pluginData: {
        importer: realPath,
      },
      loader: 'css',
    };
  } catch (e) {
    console.error(`[sass-plugin] compile ${realPath} error: ${e.stack}`);
  }
}


export const pluginSass = (context: Compiler): Plugin => {
  return {
    name: SASS_PLUGIN_NAME,
    setup(build) {
      const { fileSystem } = context.options;
      fs = fileSystem;
      build.onResolve({
        filter: SASS_REGEXP,
        namespace: SassNamespace
      }, (args) => {
        console.log(`sass resolve ${args.path}...`);
        return {
          path: args.path,
          pluginData: args.pluginData,
          namespace: SassNamespace,
        };
      });
      build.onLoad({
        filter: SASS_REGEXP,
        namespace: SassNamespace
      }, loadSass);
    },
  };
};
