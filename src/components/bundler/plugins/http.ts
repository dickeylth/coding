import { Plugin } from 'esbuild';
// import fetch from 'node-fetch';
// import url from 'url';

const urlFetchCacheMap = new Map<string, Promise<{
  url: string,
  content: string,
  statusCode: number,
}>>();

export async function fetchPkg(url: string) {
  let resPromise = urlFetchCacheMap.get(url);
  if (!resPromise) {
    resPromise = fetch(url).then(res => 
      res.text().then(content => {
        return {
          url: res.url,
          statusCode: res.status,
          content,
        }
      })
    );
    urlFetchCacheMap.set(url, resPromise);
  }
  const res = await resPromise;
  return {
    url: res.url,
    content: res.content,
    statusCode: res.statusCode,
  };
}
export const pluginHttp = (): Plugin => {
  return {
    name: 'http',
    setup(build) {
      // 入门的http-url 的virtual module
      build.onResolve({ filter: /^https?:\/\// }, async (args) => {
        console.log(`http resolve ${args.path}...`);
        return {
          namespace: 'http-url',
          path: args.path,
        };
      });
      // 非入口的http-url的virtual module
      build.onResolve({ filter: /.*/, namespace: 'http-url' }, async (args) => {
        console.log(`http resolve ${args.path}..., with namespace`);
        const path = new URL(args.path, args.resolveDir.replace(/^\//, '')).toString();

        console.log(`>> resolve ${args.path} to ${path}`);

        return {
          path,
          namespace: 'http-url',
        };
      });
      // 加载http-url
      build.onLoad({ filter: /.*/, namespace: 'http-url' }, async (args) => {
        const { content, url } = await fetchPkg(args.path);

        return {
          contents: content,
          loader: 'ts',
          resolveDir: `/${url}`, // a hack fix resolveDir problem
        };
      });
    },
  };
};
