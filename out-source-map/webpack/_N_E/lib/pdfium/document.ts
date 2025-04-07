import { PageRange } from 'types/page-range';
import PDFiumImage from './image';
import {
  PDFiumChunk,
  PDFiumDocumentResponse,
  PDFiumMetadataResponse,
} from './messages';
import type PDFiumWorker from './worker-wrapper';
import intersectDocxPdfText, {
  IntersectionError,
} from 'lib/intersect-docx-pdf-text';
import { captureException } from 'lib/sentry';
import Tracking from 'lib/tracking';
import { WordDocumentInfo } from 'types/word-doc-info';
import { FileInfo } from 'types/file-info';
import formatFileSize from 'lib/format-file-size';
import { DocxDocument, DocxDocumentFactory } from 'lib/docx-document';
import {
  DocxFooter,
  Footnote,
  DocxHeader,
  Endnote,
  Settings,
  DocInfo,
} from 'types/docx-document';
import { RichTextDrawingChunk } from 'types/rich-text';

export interface PDFiumDocumentContent {
  rawText: string;
  text: string;
  images: PDFiumImage[];
  chunks: PDFiumChunk[][];
  docxHeaders?: DocxHeader[];
  docxFooters?: DocxFooter[];
  docxFootnotes?: Footnote[];
  docxEndnotes?: Endnote[];
  docxSettings?: Settings;
  docxDocInfo?: DocInfo;
  hash?: string;
}

class PDFiumDocument {
  private readonly _worker: PDFiumWorker;
  readonly fileInfo: FileInfo;
  readonly pageCount: number;
  readonly thumbnail: PDFiumImage;
  readonly hash?: string;
  private _wordDocumentInfo?: WordDocumentInfo;
  private _docxDocument?: DocxDocument;

  constructor(
    worker: PDFiumWorker,
    response: PDFiumDocumentResponse,
    fileInfo: FileInfo,
    wordDocumentInfo?: WordDocumentInfo,
    hash?: string,
  ) {
    this._worker = worker;
    this.fileInfo = fileInfo;
    this.pageCount = response.pageCount;
    this.thumbnail = new PDFiumImage(response.thumbnail, 0, this._worker);
    this._wordDocumentInfo = wordDocumentInfo;
    this.hash = hash;
  }

  get id(): number {
    return this._worker.id;
  }

  get convertedFromDocx(): boolean {
    return (
      this._wordDocumentInfo?.fileType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  }

  get wordDocumentInfo() {
    return this._wordDocumentInfo;
  }

  async getContent(
    pageRange: PageRange,
    useRawDocx: boolean = false,
  ): Promise<PDFiumDocumentContent | undefined> {
    try {
      const response = await this._worker.getDocumentContent(pageRange);

      const content: PDFiumDocumentContent = {
        rawText: '',
        text: '',
        images: [],
        chunks: [],
      };
      const decoder = new TextDecoder();

      response.forEach(({ text, image, chunks }, i) => {
        const textString = decoder.decode(text);
        content.text += textString ? textString + '\n' : '';
        content.images.push(
          new PDFiumImage(image, pageRange.from + i - 1, this._worker),
        );
        content.chunks.push(chunks);
      });

      if (!useRawDocx) {
        return content;
      }

      const document = await this.getDocxDocument();
      const rawDocxText = await document?.getBodyText();
      const headers = await document?.getHeaders();
      const footers = await document?.getFooters();
      const footnotes = await document?.getFootnotes();
      const endNotes = await document?.getEndnotes();
      const settings = await document?.getSettings();
      // Since we're not even using the contents of docInfo,
      // we're commenting this out for now for performance reasons.
      // const docInfo = await document?.getDocInfo();

      if (rawDocxText !== undefined) {
        if (pageRange.from === 1 && pageRange.to == this.pageCount) {
          Tracking.trackEvent('Used raw docx text');
          content.rawText = rawDocxText;
          content.docxHeaders = headers;
          content.docxFooters = footers;
          content.docxFootnotes = footnotes?.filter(
            (footnote) => footnote.text !== '',
          );
          content.docxEndnotes = endNotes?.filter(
            (endnote) => endnote.text !== '',
          );
          content.docxSettings = settings;
          // See the commented code above that sets docInfo.
          // content.docxDocInfo = docInfo;
        } else {
          Tracking.trackEvent('Started docx-pdf intersection');
          try {
            content.rawText = intersectDocxPdfText(rawDocxText, content.text);
            Tracking.trackEvent('Completed docx-pdf intersection');
          } catch (error) {
            let reason: string;
            if (error instanceof IntersectionError) {
              reason = error.message;
            } else {
              reason = 'Unknown error';
              captureException(error, {
                tags: {
                  action: 'intersectDocxPdfText',
                },
              });
            }
            Tracking.trackEvent('Failed docx-pdf intersection', {
              reason,
            });
          }
        }
      }

      return content;
    } catch (error) {
      console.error(error);
      captureException(error, {
        tags: { 'pdf.lib': 'pdfium', 'pdf.stage': 'get-content' },
        contexts: {
          PDFium: {
            fileSize: this.fileInfo.fileSize
              ? formatFileSize(this.fileInfo.fileSize, 2)
              : undefined,
            pageRange,
          },
        },
      });
    }
  }

  async getMetadata(): Promise<PDFiumMetadataResponse> {
    return this._worker.getMetadata();
  }

  async destroy() {
    return this._worker.destroy();
  }

  async getAnnotatedPDF(data: RichTextDrawingChunk[], pageRange: PageRange) {
    return this._worker.getAnnotatedPDF(data, pageRange);
  }

  private async getDocxDocument() {
    if (!this._wordDocumentInfo) {
      return;
    }
    if (this._docxDocument) {
      return this._docxDocument;
    }
    this._docxDocument = await DocxDocumentFactory.create(
      this._wordDocumentInfo.data,
    );
    return this._docxDocument;
  }

  async getPDFBuffer(pageRange: PageRange) {
    return this._worker.getBuffer(pageRange);
  }

  async getStandardizedPDF(pageRange: PageRange, pageIndices: number[]) {
    return this._worker.getStandardizedPDF(pageRange, pageIndices);
  }
}

export default PDFiumDocument;
