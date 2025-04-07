import { PageRange } from 'types/page-range';
import {
  handlePDFiumErrorResponse,
  DestroyedWorkerException,
} from './exceptions';
import {
  PDFiumDocumentContentResponse,
  PDFiumDocumentResponse,
  PDFiumImageResponse,
  PDFiumMetadataResponse,
  PDFiumWorkerMessageType,
} from './messages';
import { getFPDFPath } from './fpdf';
import { RichTextDrawingChunk, RichTextExportType } from 'types/rich-text';

class PDFiumWorker {
  private static _idCount: number = 0;

  private readonly _id: number;
  private readonly _worker: Worker;
  private _callbacks: Record<
    number,
    {
      resolve: (value: any | PromiseLike<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      reject: (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  > = {};
  private _messageCount: number = 0;
  private _destroying: boolean = false;

  constructor() {
    this._id = PDFiumWorker._idCount++;
    this._worker = new Worker(new URL('./worker.ts', import.meta.url));
    this._worker.onmessage = this._onMessage.bind(this);
  }

  get id(): number {
    return this._id;
  }

  get destroying(): boolean {
    return this._destroying;
  }

  private _onMessage(event: MessageEvent) {
    const { id, data, error } = event.data;

    if (typeof id !== 'number' || !this._callbacks[id]) {
      return;
    }

    if (error) {
      console.log(error);
      this._callbacks[id].reject(handlePDFiumErrorResponse(error));
    } else {
      this._callbacks[id].resolve(data);
    }

    delete this._callbacks[id];
  }

  private async _sendMessage<T = void>(
    type: PDFiumWorkerMessageType,
    data?: unknown,
    transfer?: Transferable[],
  ) {
    const id = this._messageCount++;

    return new Promise<T>((resolve, reject) => {
      this._callbacks[id] = { resolve, reject };
      this._worker.postMessage({ id, type, data }, { transfer });
    });
  }

  async init(): Promise<typeof this> {
    const filePath = await getFPDFPath();
    return this._sendMessage(PDFiumWorkerMessageType.INIT, filePath);
  }

  async createBuffer(file: ArrayBuffer): Promise<void> {
    await this._sendMessage(PDFiumWorkerMessageType.CREATE_BUFFER, file, [
      file,
    ]);
  }

  async getBuffer(pageRange: PageRange): Promise<ArrayBuffer> {
    const data = { pageRange };
    return this._sendMessage(PDFiumWorkerMessageType.GET_BUFFER, data);
  }

  async loadDocument(password?: string): Promise<PDFiumDocumentResponse> {
    return this._sendMessage(PDFiumWorkerMessageType.LOAD_DOCUMENT, password);
  }

  async getDocumentContent(
    pageRange: PageRange,
  ): Promise<PDFiumDocumentContentResponse> {
    return this._sendMessage(
      PDFiumWorkerMessageType.GET_DOCUMENT_CONTENT,
      pageRange,
    );
  }

  async getPageContent(pageIndex: number): Promise<PDFiumImageResponse> {
    return this._sendMessage(
      PDFiumWorkerMessageType.GET_PAGE_CONTENT,
      pageIndex,
    );
  }

  async getMetadata(): Promise<PDFiumMetadataResponse> {
    return this._sendMessage(PDFiumWorkerMessageType.GET_METADATA);
  }

  async destroy(): Promise<void> {
    if (!this._destroying) {
      this._destroying = true;

      Object.values(this._callbacks).forEach(({ reject }) => {
        reject(new DestroyedWorkerException());
      });

      this._callbacks = {};

      await this._sendMessage(PDFiumWorkerMessageType.DESTROY);
      this._worker.terminate();
    }
  }

  // TODO(@jimgeng): add-in bounding box information later.
  async createSplitDocument(
    leftRawData: ArrayBuffer,
    rightRawData: ArrayBuffer,
    exportType: RichTextExportType,
  ): Promise<ArrayBuffer> {
    return this._sendMessage(
      PDFiumWorkerMessageType.CREATE_SPLIT_DOCUMENT,
      { leftRawData, rightRawData, exportType },
      [leftRawData, rightRawData],
    );
  }

  async getAnnotatedPDF(
    drawingChunks: RichTextDrawingChunk[],
    pageRange: PageRange,
  ): Promise<ArrayBuffer> {
    const data = { drawingChunks, pageRange };
    return this._sendMessage(PDFiumWorkerMessageType.GET_ANNOTATED_PDF, data);
  }

  async getStandardizedPDF(
    pageRange: PageRange,
    pageIndices: number[],
  ): Promise<ArrayBuffer> {
    const data = { pageRange, pageIndices };
    return this._sendMessage(
      PDFiumWorkerMessageType.GET_STANDARDIZED_PDF,
      data,
    );
  }
}

export default PDFiumWorker;
