import { BuildResult, Platform } from 'esbuild';
import { Plugin } from 'rollup';
import type { Format } from 'esbuild';

export interface CompilerHooks {
  start?(): void;
  done?(result: BuildResult): void;
}
export interface CompilerOptions {
  input: string;
  output?: string;
  unpkg?: boolean;
  memfs?: boolean;
  http?: boolean;
  fileSystem?: typeof import('fs');
  plugins?: Plugin[];
  hooks?: CompilerHooks;
  watch?: boolean;
  format?: Format;
  cwd?: string;
  platform?: Platform;
}

export type FileSystem = typeof import('fs');
