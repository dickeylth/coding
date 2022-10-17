/*
 * @Author: 弘树(tiehang.lth@alibaba-inc.com)
 * @Date: 2020-12-12 22:26:10
 * @fileoverview 自动同步 ts 类型定义
 */
import Dexie from 'dexie';
import { message } from 'antd';
import { languages } from 'monaco-editor';
import request from '@/utils/request';

// 最多缓存 7 天
const CACHE_TIME = 7 * 24 * 60 * 60 * 1000;
// 包里包含的定义文件的上限，超过了走服务端拉 zip 解压
const MAX_DEFINITION_FILE_COUNT = 10;

// compiler options
languages.typescript.javascriptDefaults.setCompilerOptions({
  jsx: languages.typescript.JsxEmit.React,
});
languages.typescript.typescriptDefaults.setCompilerOptions({
  target: languages.typescript.ScriptTarget.ES5,
  // allowNonTsExtensions: true,
  declaration: true,
  // maxNodeModuleJsDepth: 2,
  module: languages.typescript.ModuleKind.ESNext,
  moduleResolution: languages.typescript.ModuleResolutionKind.NodeJs,
  // module: languages.typescript.ModuleKind.CommonJS,
  noEmit: true,
  // noLib: true,
  // allowJs: true,
  esModuleInterop: true,
  jsx: languages.typescript.JsxEmit.React,
  jsxFragmentFactory: 'React.Fragment',
  allowSyntheticDefaultImports: true,
  jsxFactory: 'React.createElement',
  // lib: ['es2017', 'dom'],
  // noUnusedLocals: true,
  // skipLibCheck: true,
  typeRoots: ['node_modules'],
});

languages.typescript.typescriptDefaults.setEagerModelSync(true);
languages.typescript.javascriptDefaults.setEagerModelSync(true);
// languages.typescript.typescriptDefaults.setDiagnosticsOptions({
//   noSemanticValidation: false,
//   noSyntaxValidation: false
// });

interface ITypeDefinition {
  id?: number;
  name: string;
  // version: string,
  definitions: Array<{
    path: string;
    content: string;
  }>;
  time: number;
}
class TsDefinitionDB extends Dexie {
  // Declare implicit table properties.
  // (just to inform Typescript. Instanciated by Dexie in stores() method)
  tsDefinitions: Dexie.Table<ITypeDefinition, number>; // number = type of the primkey
  // ...other tables goes here...

  constructor () {
    super('TsDefinitionDB');
    this.version(1).stores({
      tsDefinitions: '++id, name, definitions, time',
        // ...other tables goes here...
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.tsDefinitions = this.table('tsDefinitions');
  }
}
const db = new TsDefinitionDB();

const syncPkgQueue: string[] = [];
/**
 * 同步完的包的映射表
 */
const syncPkgMap: {
  [key: string]: number;
} = {};
let syncPromise: Promise<any> = Promise.resolve(true);

const recursiveParseFile = (files: any[], result: any[] = []) => {
  const reg = /\.d\.ts$/;
  files.forEach(f => {
    if (f.type === 'file' && reg.test(f.path)) {
      result.push(f.path);
    } else if (f.type === 'directory') {
      recursiveParseFile(f.files, result);
    }
  });
  return result;
};

const syncPkgDefinitions = async (
  matchLib: ITypeDefinition, tsPkgName: string,
  pkgName: string, pkgVersion: string
) => {
  try {
    const pkgId = [pkgName, pkgVersion].filter(Boolean).join('/');
    const checkTypeResult = await request(
      `https://unpkg.alibaba-inc.com/meta/${tsPkgName}/`);
    if (checkTypeResult.files) {
      const definitionFiles = recursiveParseFile(checkTypeResult.files);
      let definitions: ITypeDefinition['definitions'] = [];
      if (definitionFiles.length > MAX_DEFINITION_FILE_COUNT) {
        const definitionResult = await request(
          `/api/playground/definition`, {
          params: {
            pkgName: tsPkgName,
            version: tsPkgName === pkgName ? pkgVersion : undefined,
          }
        });
        if (definitionResult.success) {
          definitions = definitionResult.data;
        }
      } else {
        definitions = await Promise.all(
          definitionFiles.map(async (filePath: string) => {
            const fileContent = await request(`https://unpkg.alibaba-inc.com/${tsPkgName}${filePath}`);
            return {
              path: filePath,
              content: fileContent,
            };
        }));
      }
      if (definitions.length === 0) { return null; }
      if (!definitions.some(i => /^\.?\/?index\.d\.ts$/.test(i.path))) {
        try {
          const pkgJsonResult = await request([
            `https://unpkg.alibaba-inc.com/${pkgName}`,
            pkgVersion,
            'package.json'
          ].filter(Boolean).join('/'));
          if (pkgJsonResult) {
            const entry = pkgJsonResult.typings || pkgJsonResult.types;
            let typingDir: string;
            if (entry) {
              // 指定了 entry
              typingDir = `/${entry.split('/').slice(0, -1).join('/').replace(/^(\.?)\//, '')}`;
            } else {
              const checkLibEsTypesResult = definitions.filter(i =>
                /^\/(lib|es|types)\/index\.d\.ts$/.test(i.path)
              )[0];
              if (checkLibEsTypesResult) {
                typingDir = `/${checkLibEsTypesResult.path.split('/').slice(0, -1).join('/').replace(/^(\.?)\//, '')}`;
              } else {
                // 没有找到 typings 入口，埋个点
                request(
                  `/api/playground/definition`, {
                  params: {
                    pkgName: tsPkgName,
                    version: tsPkgName === pkgName ? pkgVersion : undefined,
                  }
                });
              }
            }
            if (typingDir) {
              definitions = definitions
                .filter(i => i.path.indexOf(typingDir) >= 0)
                .map(i => ({
                  ...i,
                  path: i.path.replace(typingDir, ''),
                }));
            }
          }
          // if (pkgJsonResult && pkgJsonResult.typings) {
          //   definitions.push({
          //     path: 'index.d.ts',
          //     content: `export * from './${pkgJsonResult.typings.replace(/\.d\.ts$/, '')}';`,
          //   });
          // } else {
          //   const definitionConcat = definitions.map(def => {
          //     return `export * from './${def.path.replace(/^\./, '').replace(/^\//, '').replace(/\.d\.ts$/, '')}';`;
          //   }).join('\n');
          //   definitions.push({
          //     path: 'index.d.ts',
          //     content: definitionConcat,
          //   });
          // }
        } catch (e) {
          console.error(`获取 ${pkgName}@${pkgVersion} package.json 失败：`);
          console.error(e);
        }
      }
      if (!matchLib) {
        await db.tsDefinitions.add({
          name: pkgId,
          definitions,
          time: Date.now(),
        });
      } else {
        await db.tsDefinitions.where({
          id: matchLib.id
        }).modify({
          definitions,
          time: Date.now(),
        });
      }
      definitions.forEach(({ path, content }) => {
        const filePath = `file:///node_modules/${[pkgName, pkgVersion].join('/').replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        languages.typescript.typescriptDefaults.addExtraLib(
          content, filePath);
      });
      message.success(`拉取 ${pkgName} ts 定义文件成功！`);
      return definitions;
    }
  } catch (e) {
    console.error(`sync ${pkgName} type definitions error: ${e.stack}`);
  }
  return null;
};

export default async (code: string) => {
  try {
    syncPromise = syncPromise.then(async () => {
      const importReg = /import.*from\s*(?:'|")(.*)(?:'|")/g;
      let matchResult;
      let frameworkType: string;
      // tslint:disable-next-line: no-conditional-assignment
      while (matchResult = importReg.exec(code)) {
        const [, pkgId] = matchResult;
        let formatPkgId = pkgId;
        // 处理一下 import 子目录
        if (/^@/.test(pkgId)) {
          formatPkgId = pkgId.split('/').slice(0, 2).join('/');
        } else {
          formatPkgId = pkgId.split('/')[0];
        }
        if (/^(react|rax)$/.test(formatPkgId)) {
          frameworkType = formatPkgId;
        }
        if (formatPkgId && !syncPkgMap[formatPkgId]
          && syncPkgQueue.indexOf(formatPkgId) === -1) {
          syncPkgQueue.push(formatPkgId);
        }
      }
      const compilerOptions = languages.typescript
        .typescriptDefaults.getCompilerOptions();
      if (frameworkType === 'rax' && compilerOptions.jsxFactory !== 'createElement') {
        // Rax
        languages.typescript.typescriptDefaults.setCompilerOptions({
          ...compilerOptions,
          jsxFactory: 'createElement',
        });
      } else if (frameworkType === 'react' && compilerOptions.jsxFactory !== 'React.createElement') {
        languages.typescript.typescriptDefaults.setCompilerOptions({
          ...compilerOptions,
          jsxFactory: 'React.createElement',
        });
      }
      console.log(`syncPkgQueue: ${syncPkgQueue.join()}`);
      if (syncPkgQueue.length === 0) { return; }
      const currentDBData = await db.tsDefinitions.toArray();
      await Promise.all(syncPkgQueue.map(async pkgId => {
        const matchLib = currentDBData.filter(i => i.name === pkgId).pop();
        const needUpdate = !matchLib || (Date.now() - matchLib.time) > CACHE_TIME;
        if (needUpdate) {
          let tsPkgName: string;
          const [, pkgName, pkgVersion] =
            // tslint:disable-next-line: no-sparse-arrays
            pkgId.indexOf('@') > 0 ? pkgId.split(/(.+)@/) : [, pkgId];
          // 需要特殊考虑 scoped package
          if (/^@/.test(pkgName)) {
            if (/^@ali(fe}|alipay)?/.test(pkgName)) {
              // ali scope，直接从包里去解析
              tsPkgName = pkgName;
            } else {
              // 外部 scope
              tsPkgName = `@types/${pkgName.slice(1).replace(/\//, '__')}`;
            }
          } else {
            tsPkgName = `@types/${pkgName}`;
          }
          if (/^@types\//.test(tsPkgName)) {
            // 需要探测一下 @types 包是否存在，如果不存在，需要回退到本包
            try {
              await request(`https://unpkg.alibaba-inc.com/${tsPkgName}/package.json`, {
                method: 'HEAD',
                errorHandler: (res => {
                  if (res.response.status === 404) {
                    // 不存在包，降级
                    tsPkgName = pkgId;
                    return;
                  }
                })
              });
            } catch (e) {
              console.error(e);
            }
          }
          let definitions = await syncPkgDefinitions(
            matchLib, tsPkgName, pkgName, pkgVersion);
          if (!definitions) {
            // 没有同步到，尝试重新同步自身包
            definitions = await syncPkgDefinitions(
              matchLib, pkgName, pkgName, pkgVersion);
          }
          if (definitions && definitions.length > 0) {
            syncPkgQueue.splice(syncPkgQueue.indexOf(pkgId), 1);
            syncPkgMap[pkgId] = 1;
          }
        } else {
          const { definitions } = matchLib;
          definitions.forEach(({ path, content }) => {
            const filePath = `file:///node_modules/${pkgId}/${path.replace(/^\//, '')}`;
            languages.typescript.typescriptDefaults.addExtraLib(
              content, filePath);
          });
          syncPkgQueue.splice(syncPkgQueue.indexOf(pkgId), 1);
          syncPkgMap[pkgId] = 1;
        }
      }));
    });
    await syncPromise;
  } catch (e) {
    console.error(`sync ts lib error:`);
    console.error(e);
  }
};
