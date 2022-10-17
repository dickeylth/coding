/*
 * @Author: 弘树(tiehang.lth@alibaba-inc.com)
 * @Date: 2020-12-17 23:36:26
 * @fileoverview Device mocker
 */
import React, { useEffect, useRef, useState } from 'react';
import Portal from '../Portal';
import 'devices.css/dist/devices.min.css';
import './index.less';
import { Select } from 'antd';

const { Option } = Select;
const DeviceMap = {
  'iphone-x': 'iPhone X',
  'iphone-8': 'iPhone 8',
  'google-pixel-2-xl': 'Google Pixel 2 XL',
  'google-pixel': 'Google Pixel',
  'galaxy-s8': 'Samsung Galaxy S8'
}

export default (props: {
  children: React.ReactNode;
  selectorRoot?: Element;
}) => {
  const deviceSelector = useRef<HTMLDivElement>();
  const defaultDevice = Object.keys(DeviceMap)[0];
  const [deviceId, setDeviceId] = useState(defaultDevice);
  const [selectorRoot, setSelectorRoot] = useState(props.selectorRoot);
  const hasSetRoot = useRef(false);

  useEffect(() => {
    if (props.selectorRoot) {
      setSelectorRoot(props.selectorRoot);
      hasSetRoot.current = true;
    }
  }, [props.selectorRoot]);

  useEffect(() => {
    setTimeout(() => {
      if (!hasSetRoot.current) {
        setSelectorRoot(deviceSelector.current);
      }
    }, 1000);
  }, []);

  const handleChange = (val: string) => setDeviceId(val);

  return (
    <div className='device-container'>
      {selectorRoot && (
        <>
          <div className='device-selector' ref={deviceSelector}></div>
          <Portal root={selectorRoot}>
            <Select defaultValue={defaultDevice} style={{ minWidth: 160 }} onChange={handleChange}>
              {
                Object.keys(DeviceMap).map(did =>
                  <Option key={did} value={did}>{DeviceMap[did as keyof typeof DeviceMap]}</Option>
                )
              }
            </Select>
          </Portal>
        </>)
      }
      <div className={`device device-${deviceId}`}>
        <div className='device-frame'>
          <div className='device-content'>{props.children}</div>
        </div>
        <div className='device-stripe'></div>
        <div className='device-header'></div>
        <div className='device-sensors'></div>
        <div className='device-btns'></div>
        <div className='device-power'></div>
      </div>
    </div>
  );
};
