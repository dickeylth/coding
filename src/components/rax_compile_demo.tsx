const CODE = `
/** @jsx createElement */
import { createElement, useEffect, useState } from 'rax';
import { isMiniApp } from 'universal-env';
import RecyclerView from 'rax-recyclerview'
import Text from 'rax-text';
import Image from 'rax-image';
import View from 'rax-view';
import Train12306LoginSlider from '../../App';
import './index.css';

export default function App() {
  const source = { uri: 'https://gw.alicdn.com/tfs/TB1JpgJRFXXXXc7XpXXXXXXXXXX-800-800.png' };
  const [show, setShow] = useState(true);
  const props = {
    account12306Name: 'we',
    type: 'pc',
    mode: '1', // 1 : 短信&滑块, 2 ：滑块,3 ：短信
    sliderAppKey: "FFFF0N000000000085DE",
    sliderToken: "FFFF0N000000000085DE:1630909260539:0.280691905749087761",
    sliderScene: "nc_login",
    onCheckCallback: () => {
      setShow(false);
    },
  }

  useEffect(function() {
    if (isMiniApp) {
      my.setNavigationBar({
        title: 'Train12306LoginSlider - Demo'
      });
    }
  }, []);

  return (
    <RecyclerView
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      className="container">
      <RecyclerView.Cell>
        <View className="component-title" onClick={() => setShow(true)}>
          <Image
            className="logo"
            source={source}
            resizeMode="contain" />
          <Text>Train12306LoginSlider</Text>
        </View>
      </RecyclerView.Cell>

      <RecyclerView.Cell>
        <View className="demo-section">
          <Text className="category">基本使用</Text>
          <View x-if={show}>
            <Train12306LoginSlider {...props}/>
          </View>
        </View>
      </RecyclerView.Cell>

      <View>
        <Text>Hello fpaall</Text>
      </View>
    </RecyclerView>
  );
}
`;

import jsxList from 'babel-plugin-transform-jsx-list';
import jsxCondition from 'babel-plugin-transform-jsx-condition';
import jsxMemo from 'babel-plugin-transform-jsx-memo';
import jsxSlot from 'babel-plugin-transform-jsx-slot';
import jsxFragment from 'babel-plugin-transform-jsx-fragment';
import jsxClass from 'babel-plugin-transform-jsx-class';
import tsSyntax from '@babel/plugin-syntax-typescript';
const babelRaxJsxPlugins = [
  jsxList,
  jsxCondition,
  jsxMemo,
  jsxSlot,
  jsxFragment,
  jsxClass,
  [tsSyntax, {
    isTSX: true,
  }],
];

import * as babel from '@babel/standalone';
(async () => {
  const afterJsxCompileCode = babel.transform(CODE, {
    plugins: babelRaxJsxPlugins,
    // parserOpts: {

    // },
  });
  console.log(afterJsxCompileCode);
})().catch(e => {
  console.error(e);
})


export default function Dashboard() {
  return (
    <div>
      <h2>Dashboard page</h2>
    </div>
  );
}
