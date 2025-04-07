export type ImageState = {
  x: number;
  y: number;
  zoomFactor: number;
};

export interface ImageDiffState {
  url: string;
  fileName: string;
  filePath?: string;
  arrayBuffer?: ArrayBuffer;
  height: number;
  width: number;
  size: number;
}

export const ImageDiffStateDefault = {
  url: '',
  fileName: '',
  height: -1,
  width: -1,
  size: 0,
};

export enum ImageEvent {
  RESET = 'reset',
  DRAG = 'drag',
  ZOOM_IN = 'zoomIn',
  ZOOM_OUT = 'zoomOut',
}
