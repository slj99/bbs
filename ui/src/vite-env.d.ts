/// <reference types="vite/client" />

// 声明所有 .svg 文件的导入类型
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

  const src: string;
  export default src;
}

// 扩展 Vite 的 import.meta.env 类型定义
interface ImportMetaEnvExt extends ImportMetaEnv {
  readonly VITE_R2_PUBLIC_URL: string;
  // 您可以在这里添加更多从 .env 文件或 vite.config.js 注入的环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnvExt;
}
