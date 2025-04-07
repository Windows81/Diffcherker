import { WordDocumentInfo } from './word-doc-info';

export enum PdfConversionMedium {
  MS_WORD = 'ms-word',
  LO_WASM = 'lo-wasm',
  MAC_PAGES = 'mac-pages',
  MAC_MS_WORD = 'mac-ms-word',
  API = 'api',
  MICROSOFT_GRAPH = 'microsoft-graph',
  DOCUMENT_TO_PDF = 'document-to-pdf',
}

export type PdfConversionResult = {
  data: ArrayBuffer;
  medium: PdfConversionMedium;
  documentInfo: WordDocumentInfo;
  rawText?: string;
};
