/// <reference types="vite/client" />

declare module 'dom-to-image-more' {
  const domtoimage: {
    toPng: (node: Node, options?: object) => Promise<string>;
    toJpeg: (node: Node, options?: object) => Promise<string>;
    toBlob: (node: Node, options?: object) => Promise<Blob>;
    toSvg: (node: Node, options?: object) => Promise<string>;
  };
  export default domtoimage;
}

