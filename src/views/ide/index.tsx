const files = {};

declare var PREBUILTIN_NODE_MODULES: Record<string, string>;
Object.assign(files, PREBUILTIN_NODE_MODULES || {});

import { compileMemfs, Compiler } from '../../components/bundler';
import { useEffect, useRef, useState } from 'react';
import ProCard from '@ant-design/pro-card';
import syncDefitions from './utils/syncTsLib';
import { debounce } from 'lodash';
import './index.less';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.MonacoEnvironment = {
  getWorker (_: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    if (label === 'json') return new JsonWorker()
    if (label === 'css') return new CssWorker()
    if (label === 'html') return new HtmlWorker()
    return new EditorWorker()
  }
}

import {
  EditOutlined, SaveOutlined, QrcodeOutlined,
  LinkOutlined, ForkOutlined
} from '@ant-design/icons';
import DeviceSimulator from '@/components/DeviceSimulator';
import html from './preview/index.html?raw';
import {
  Row, Col, Card, message, Modal, Form, Input, Select, Button,
  Tooltip, Divider, Popover, Tabs, Alert
} from 'antd';
import monaco, { editor, languages, Uri, KeyMod, KeyCode } from 'monaco-editor';
import { DefaultTemplateFiles } from './constants';


const getInitialCode = () => {
  const urlObj = new URL(location.href);
  const type = (urlObj.searchParams.get('type') || 'react') as keyof typeof DefaultTemplateFiles;
  return DefaultTemplateFiles[type];
};

const modelMap: {
  js: null | editor.ITextModel,
  css: null | editor.ITextModel
} = {
  js: null,
  css: null,
};
const getModelByType = (type: string) => {
  if (type === 'js') {
    const jsxModelUri = Uri.file('/index.tsx');
    if (editor.getModel(jsxModelUri)) {
      modelMap.js = editor.getModel(jsxModelUri);
    } else {
      modelMap.js = editor.createModel(
        getInitialCode()['index.tsx'],
        'typescript',
        jsxModelUri
      );
      modelMap.js.updateOptions({
        tabSize: 2,
      });
    }
    return modelMap.js;
  } else if (type === 'css') {
    const cssModelUri = Uri.file('/index.css');
    if (editor.getModel(cssModelUri)) {
      modelMap.css = editor.getModel(cssModelUri);
    } else {
      modelMap.css = editor.createModel(
        '',
        'css',
        cssModelUri
      );
    }
    return modelMap.css;
  }
  return null;
};



export default function IDE() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const editorContainerRef = useRef();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const [pgInst, setPgInst] = useState<any>();
  const [form] = Form.useForm();
  const deviceSelectorRef = useRef<HTMLDivElement>();
  const [deviceSelector, setDeviceSelector] = useState<HTMLDivElement>();
  const editorDataRef = useRef({
    js: {
      model: getModelByType('js'),
      state: null as editor.ICodeEditorViewState | null,
      value: getInitialCode()['index.tsx'],
    },
    css: {
      model: getModelByType('css'),
      state: null as editor.ICodeEditorViewState | null,
      value: getInitialCode()['index.scss'],
    },
  });
  const compilerRef = useRef<Compiler>();

  const handleEditorTab = (value = 'js') => {
    const key = value as keyof typeof editorDataRef.current;
    const editorInst = editorRef.current;
    if (editorInst) {
      const curModal = editorInst.getModel();
      const state = editorInst.saveViewState();
      const value = editorInst.getValue();
      if (curModal === getModelByType('js')) {
        editorDataRef.current.js.state = state;
        editorDataRef.current.js.value = value;
      } else if (curModal === getModelByType('css')) {
        editorDataRef.current.css.state = state;
        editorDataRef.current.css.value = value;
      }
      editorInst.setModel(getModelByType(key));
      editorInst.restoreViewState(editorDataRef.current[key].state);
      const matchTypeCurValue = editorDataRef.current[key].value;
      if (editorInst.getValue().trim.length === 0 && matchTypeCurValue) {
        editorInst.setValue(matchTypeCurValue);
      }
      editorInst.focus();
    }
  };
  const syncEditorValues = () => {
    const editorInst = editorRef.current;
    if (editorInst) {
      const source = editorInst.getValue();
      const model = editorInst.getModel();
      if (model === getModelByType('js')) {
        editorDataRef.current.js.value = source;
      } else if (model === getModelByType('css')) {
        editorDataRef.current.css.value = source;
      }
      return {
        jsCode: editorDataRef.current.js.value,
        cssCode: editorDataRef.current.css.value,
      };
    }
  };

  const handleSave = async () => {
    const values = syncEditorValues();
    if (compilerRef.current) {
      const compiler = compilerRef.current;
      const fs = compiler.options.fileSystem;
      await fs.promises.writeFile(`index.tsx`, values?.jsCode || '');
      await fs.promises.writeFile(`index.scss`, values?.cssCode || '');
      if (compiler.result?.rebuild) {
        const result = await compiler.result?.rebuild();
        if (compiler.options.hooks.done) {
          // 手动调用一次 done，把编译结果传给 iframe
          compiler.options.hooks.done(result);
        }
      }
    }
  };


  useEffect(() => {
    if (editorContainerRef.current) {
      // 拉取 detail
      if (!editorRef.current) {
        const editorInst = editor.create(editorContainerRef.current, {
          // model: jsxModel,
          tabSize: 2,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
        });
        // tslint:disable-next-line: no-bitwise
        editorInst.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, handleSave);
        editorRef.current = editorInst;
        handleEditorTab();
        // extra libraries
        syncDefitions(editorInst.getValue());
        editorInst.onDidChangeModelContent(
          debounce((e: editor.IModelContentChangedEvent) => {
            if (editorInst.getModel() === getModelByType('js')) {
              syncDefitions(editorInst.getValue());
            }
          }, 1000));

        // init
        Object.assign(files, getInitialCode());
        const compiler = compileMemfs(files, {
          input: 'main.tsx',
          hooks: {
            done(result) {
              const compileResult = {} as Record<string, string>;
              result?.outputFiles?.forEach((x) => {
                compileResult[x.path] = x.text;
              });
              iframeRef.current?.contentWindow?.postMessage({
                compileResult,
              });
            },
          },
        });
        compiler.build();
        compilerRef.current = compiler;
      }
    }
    if (deviceSelectorRef.current) {
      setDeviceSelector(deviceSelectorRef.current);
    }
  }, [editorContainerRef.current]);


  return (
    <>
      <ProCard split='vertical' size='small' bordered>
        <ProCard colSpan='64%'>
          <Tabs
            onTabClick={handleEditorTab}
            tabBarExtraContent={(
              <Tooltip arrowPointAtCenter placement='topLeft' title='您也可以在编辑器内尝试使用 Command + S 快捷键保存'>
                <Button
                  size='small'
                  type='primary'
                  shape='round'
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  style={{ marginLeft: 20 }}
                >
                  保存
                </Button>
              </Tooltip>
            )}
            items={[{
              key: 'js',
              label: 'JavaScript'
            }, {
              key: 'css',
              label: 'CSS',
              forceRender: true,
            }]}
          />
          <div className='editorContainer' ref={editorContainerRef}></div>
        </ProCard>
        <ProCard
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div ref={deviceSelectorRef}></div>
          <DeviceSimulator selectorRoot={deviceSelector}>
            <iframe
              ref={iframeRef}
              seamless
              className='iframe'
              srcDoc={html}
              title='Preview'
              frameBorder={0}
              width='100%'
              height='100%'
            />
          </DeviceSimulator>
        </ProCard>
      </ProCard>
    </>
  );
}
