export const DefaultTemplateFiles = {
  'react': {
    'main.tsx': `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './index';
import './index.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
`.trim(),
    'index.tsx': `
import React, { useState } from 'react';

export default function App () {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount(count + 1)}>count: {count}</div>
  )
}
    `.trim(),
    'index.scss': `
.container {
  font-size: 32px;
  color: red;
}
    `.trim(),
  },
  'rax': {
    'index.tsx': '',
    'index.scss': '',
    'main.tsx': `
/** @jsx createElement */
import { createElement, useEffect, useState } from 'rax';
import Text from 'rax-text';
import Image from 'rax-image';
import View from 'rax-view';

export default () => {
  return (
    <View className="container">
      <Text className="category">Hello Edith!</Text>
      <Image source={{
        width: 64,
        height: 64,
        uri: ''
      }} />
    </View>
  );
};
    `.trim(),
  }
};