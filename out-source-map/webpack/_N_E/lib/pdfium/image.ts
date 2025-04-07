import { PDFiumImageData, PDFiumImageResponse } from './messages';
import PDFiumWorker from './worker-wrapper';

class PDFiumImage {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _data: PDFiumImageData;
  private readonly _pageIndex: number;
  private readonly _worker: PDFiumWorker;

  constructor(
    response: PDFiumImageResponse,
    pageIndex: number,
    worker: PDFiumWorker,
  ) {
    this._width = response.width;
    this._height = response.height;
    this._data = response.data;
    this._pageIndex = pageIndex;
    this._worker = worker;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get pageIndex() {
    return this._pageIndex;
  }

  get canvasWidth() {
    return this._data.width;
  }

  get canvasHeight() {
    return this._data.height;
  }

  get arrayBuffer() {
    return this._data.array;
  }

  placeOnCanvas(canvas: HTMLCanvasElement) {
    const { width, height } = this._data;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });

    if (context) {
      const imageData = context.createImageData(width, height);
      imageData.data.set(new Uint8ClampedArray(this._data.array));
      context.putImageData(imageData, 0, 0);
    }
  }

  async streamOnCanvas(canvas: HTMLCanvasElement) {
    const { data } = await this._worker.getPageContent(this._pageIndex);
    const { width, height } = data;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (context) {
      const imageData = context.createImageData(width, height);
      imageData.data.set(new Uint8ClampedArray(data.array));
      context.putImageData(imageData, 0, 0);
    }
  }

  async toCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    await this.streamOnCanvas(canvas);
    return canvas;
  }
}

export const NullPDFiumImage = {
  width: 0,
  height: 0,
  pageIndex: 0,
  canvasWidth: 0,
  canvasHeight: 0,
  arrayBuffer: new ArrayBuffer(0),
  placeOnCanvas: (_canvas: HTMLCanvasElement) => {},
  streamOnCanvas: async (_canvas: HTMLCanvasElement) => {},
  toCanvas: () => document.createElement('canvas'),
};

export default PDFiumImage;
