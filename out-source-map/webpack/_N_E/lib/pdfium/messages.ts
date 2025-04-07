export type PDFiumWorkerMessage = {
  type: PDFiumWorkerMessageType;
  id: number;
  data?: unknown;
};

export type PDFiumWorkerResponse = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
};

// message types sent to worker
export enum PDFiumWorkerMessageType {
  INIT = 'init',
  CREATE_BUFFER = 'createBuffer',
  GET_BUFFER = 'getBuffer',
  LOAD_DOCUMENT = 'loadDocument',
  GET_DOCUMENT_CONTENT = 'getDocumentContent',
  GET_PAGE_CONTENT = 'getPageContent',
  GET_METADATA = 'getMetadata',
  DESTROY = 'destroy',
  GET_ANNOTATED_PDF = 'getAnnotatedPDF',
  GET_STANDARDIZED_PDF = 'getStandardizedPDF',
  CREATE_SPLIT_DOCUMENT = 'createSplitDocument',
}

export interface PDFiumDocumentResponse {
  pageCount: number;
  thumbnail: PDFiumImageResponse;
}

export interface PDFiumImageResponse {
  width: number;
  height: number;
  data: PDFiumImageData;
}

export interface PDFiumImageData {
  array: ArrayBuffer;
  width: number;
  height: number;
}

export interface PDFiumChunk {
  text: string[];
  y: [top: number, bottom: number][];
  x: [left: number, right: number][][];
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface PDFiumPageContentResponse {
  text: ArrayBuffer;
  image: PDFiumImageResponse;
  chunks: PDFiumChunk[];
}

export type PDFiumDocumentContentResponse = PDFiumPageContentResponse[];

export interface PDFiumMetadataResponse {
  title?: string;
  author?: string;
  producer?: string;
  creationDate?: string;
  modifiedDate?: string;
  formatVersion?: string;
  isLinearized?: boolean;
  isAcroFormPresent?: boolean;
  isXFAPresent?: boolean;
  isCollectionPresent?: boolean;
}

export interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PDFiumRichTextCharacterData {
  char: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  position: {
    pageCountIndex: number;
    box: BoundingBox;
  };
}
