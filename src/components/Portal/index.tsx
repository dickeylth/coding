/*
 * @Author: 弘树(tiehang.lth@alibaba-inc.com)
 * @Date: 2020-12-18 00:06:09
 * @fileoverview Portal
 */
import { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

export default (props: { children?: any; root?: Element | HTMLElement; }) => {
  const { root } = props;
  const el = useMemo(() => document.createElement('div'), []);
  useEffect(() => {
    if (root) {
      root.appendChild(el);
    }
    return () => {
      if (root) {
        root.removeChild(el);
      }
    };
  }, [root]);

  return ReactDOM.createPortal(
    props.children,
    el
  );
};
