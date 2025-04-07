import { WordDocumentInfo } from 'types/word-doc-info';
import PDFiumDocument from './document';
import {
  handlePDFiumErrorResponse,
  DestroyedWorkerException,
  PasswordException,
} from './exceptions';
import type PDFiumWorker from './worker-wrapper';
import { FileInfo } from 'types/file-info';
import { captureException } from 'lib/sentry';
import formatFileSize from 'lib/format-file-size';

export type PDFiumLoadingTaskOptions = {
  onPassword?: (firstTry: boolean) => void;
  onLoad?: (pdf: PDFiumDocument) => void;
  onError?: (error: Error) => void;

  hash?: string;
  wordDocumentInfo?: WordDocumentInfo;
  fileInfo: FileInfo;
};

class PDFiumLoadingTask {
  private readonly _worker: PDFiumWorker;
  private _loaded: boolean = false;
  private _wordDocumentInfo?: WordDocumentInfo;
  private _fileInfo: FileInfo;
  private _hash?: string;

  onPassword?: (firstTry: boolean) => void;
  onLoad?: (pdf: PDFiumDocument) => void;
  onError?: (error: Error) => void;

  constructor(
    worker: PDFiumWorker,
    file: ArrayBuffer,
    options: PDFiumLoadingTaskOptions,
  ) {
    this._worker = worker;
    this._wordDocumentInfo = options.wordDocumentInfo;
    this._fileInfo = options.fileInfo;
    this._hash = options.hash;
    this.onPassword = options.onPassword;
    this.onLoad = options.onLoad;
    this.onError = options.onError;

    try {
      this._worker
        .init()
        .then(() => this._createBuffer(file))
        .then(() => this._loadDocument());
    } catch (error) {
      captureException(error, {
        tags: { 'pdf.lib': 'pdfium', 'pdf.stage': 'loading-task' },
        contexts: {
          PDFium: {
            fileSize: this._fileInfo.fileSize
              ? formatFileSize(this._fileInfo.fileSize, 2)
              : undefined,
          },
        },
      });
      this.destroy();
    }
  }

  get id(): number {
    return this._worker.id;
  }

  private async _createBuffer(file: ArrayBuffer): Promise<void> {
    await this._worker.createBuffer(file);
    return;
  }

  private async _loadDocument(password?: string): Promise<void> {
    if (this._loaded || this._worker.destroying) {
      return;
    }

    try {
      const response = await this._worker.loadDocument(password);
      this.onLoad?.(
        new PDFiumDocument(
          this._worker,
          response,
          this._fileInfo,
          this._wordDocumentInfo,
          this._hash,
        ),
      );
      this._loaded = true;
    } catch (error) {
      if (error instanceof PasswordException && this.onPassword) {
        this.onPassword(password === undefined);
      } else if (!(error instanceof DestroyedWorkerException)) {
        this.onError?.(handlePDFiumErrorResponse(error));
        throw error;
      }
    }
  }

  async updatePassword(password: string): Promise<void> {
    return this._loadDocument(password);
  }

  async destroy() {
    await this._worker.destroy();
  }
}

export default PDFiumLoadingTask;
