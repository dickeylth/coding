const files = {
  'App.scss': `
@charset "UTF-8";

/**
 * Styles
 */

.m-pad {
  position: fixed;
  z-index: 9000;
  .m-pad-content {
    height: 100%;
  }

  &.m-pad-top {
    top: 0;
    left: 0;
    width: 100%;
  }

  &.m-pad-bottom {
    left: 0;
    bottom: 0;
    width: 100%;
  }

  &.m-pad-left {
    left: 0;
    bottom: 0;
    height: 100%;
  }

  &.m-pad-right {
    right: 0;
    bottom: 0;
    height: 100%;
  }
}
`,
  'App.tsx': `
import React, { useState } from 'react';
import './App.scss';

export default function App () {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount(count + 1)}>count: {count}</div>
  )
}
`,
  'index.tsx': `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
`
};

declare var PREBUILTIN_NODE_MODULES: Record<string, string>;
Object.assign(files, PREBUILTIN_NODE_MODULES || {});

import { compileMemfs } from '../../components/bundler';
import { useEffect, useRef, useState } from 'react';
import html from './preview/index.html?raw';

function TestApp () {
  const [count, setCount] = useState(0);
  const [show, set] = useState(false);
  const toggle = () => set(!show);
  return (
    <div onClick={() => setCount(count + 1)}>count: {count}</div>
  )
}

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const compiler = compileMemfs(files, {
      input: 'index.tsx',
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
  }, []);
  return (
    <div>
      <h2>Online bundler MVP</h2>
      <TestApp />
      <iframe
        ref={iframeRef}
        title='playground'
        className='iframe'
        srcDoc={html}
      >
      </iframe>
    </div>
  );
}
