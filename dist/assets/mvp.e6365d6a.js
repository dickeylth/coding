import{_ as n,a as p,j as e,c as d}from"./jsx-runtime.37c4a5a8.js";import{c as u}from"./index.1f315ec7.js";var f=`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="root">loading....</div>
    <script>
      window.addEventListener('message', (e) => {
        const { compileResult } = e.data;
        if (compileResult) {
          Object.keys(compileResult).forEach(function(file) {
            if (/\\.js$/.test(file)) {
              eval(compileResult[file])
            } else if (/\\.css$/.test(file)) {
              const style = document.createElement('style');
              style.textContent = compileResult[file];
              document.head.appendChild(style);
            }
          })
        }
      });
    <\/script>
  </body>
</html>
`;const m={"App.scss":`
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
`,"App.tsx":`
import React, { useState } from 'react';
import './App.scss';

export default function App () {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount(count + 1)}>count: {count}</div>
  )
}
`,"index.tsx":`
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
`};Object.assign(m,{});function h(){const[t,i]=n.exports.useState(0);return n.exports.useState(!1),p("div",{onClick:()=>i(t+1),children:["count: ",t]})}function x(){const t=n.exports.useRef(null);return n.exports.useEffect(()=>{u(m,{input:"index.tsx",hooks:{done(o){var s,a,l;const c={};(s=o==null?void 0:o.outputFiles)==null||s.forEach(r=>{c[r.path]=r.text}),(l=(a=t.current)==null?void 0:a.contentWindow)==null||l.postMessage({compileResult:c})}}}).build()},[]),p("div",{children:[e("h2",{children:"Online bundler MVP"}),e(h,{}),e("iframe",{ref:t,title:"playground",className:"iframe",srcDoc:f})]})}d.createRoot(document.getElementById("root")).render(e(x,{}));
