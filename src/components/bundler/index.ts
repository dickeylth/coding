/* eslint-disable @typescript-eslint/no-var-requires */
import { process } from './shim/polyfills';
import { Compiler } from './compiler';
import memfs from 'memfs';
// import process from './shim/process';
// import path from 'path';
import { CompilerOptions, FileSystem } from './types';

export function compileMemfs(json: Record<string, any>, options: CompilerOptions) {
  // const defer = pDefer<Record<string, string>>();
  memfs.vol.fromJSON(json, '/');
  return new Compiler({
    memfs: true,
    fileSystem: (memfs as any) as FileSystem,
    cwd: process.cwd(),
    output: 'bundle.js',
    input: options.input,
    hooks: options.hooks,
    unpkg: true,
    http: false,
    plugins: [],
  });
}
export { Compiler, memfs };
