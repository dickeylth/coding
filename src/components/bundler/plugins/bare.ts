import { Plugin } from 'esbuild';
import { Compiler } from '../compiler';
import { UnpkgNamepsace } from './unpkg';
import { UnpkgHost } from './unpkg';
import path from 'path';
export const pluginBareModule = (context: Compiler): Plugin => {
  return {
    name: 'bare',
    setup(build) {
      if (context.options.unpkg) {
        build.onResolve({ filter: /.*/ }, (args) => {
          console.log(`bare resolve ${args.path}...`);
          if (/^(?!\.).*/.test(args.path) && !path.isAbsolute(args.path)) {
            if (args.path === 'esbuild' || args.path === '@neo-tools/helpers') {
              return;
            }
            // if (args.path.indexOf('~@alife/css') >= 0) {
            //   args.path = args.path.replace(/^~/, '');
            // }
            console.log(`unpkg resolve: ${args.path}`);
            return {
              path: args.path,
              namespace: UnpkgNamepsace,
              pluginData: {
                parentUrl: UnpkgHost,
              },
            };
          }
        });
      }
    },
  };
};
