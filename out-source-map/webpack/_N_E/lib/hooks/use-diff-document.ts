import { useState, useCallback } from 'react';
import type PDFiumDocument from 'lib/pdfium/document';
import { PageRange } from '../../types/page-range';
import { WordDocumentInfo } from 'types/word-doc-info';
import { FileInfo } from 'types/file-info';
import { PDFiumDocumentContent } from 'lib/pdfium/document';

export interface PdfDocumentState {
  /**
   * The full PDFium document available when explicitly loaded via a worker
   */
  document?: PDFiumDocument;

  /**
   * The PDFium document content available when explicitly loaded from a PDFiumDocument
   *
   * (this is a separate field since it's possible to have a PDFiumDocument with no PDFiumDocumentContent)
   */
  documentContent?: PDFiumDocumentContent;

  /**
   * Document metadata available on immediate upload
   *
   * Useful to have for certain metadata before PDFium document is fully loaded
   * e.g. render filename + file size during PDFium load
   */
  rawDocument?: RawDocument;

  /**
   * Temporary thumbnail meta used until the full PDFium document is loaded.
   * After full load, the PDFium document should be used for the thumbnail.
   */
  thumbnailMeta?: ThumbnailMeta;

  /**
   * The page range to be used for the diff.
   */
  pageRange: PageRange;
}

export type ThumbnailMeta = {
  url?: string;
  document?: PDFiumDocument;
};

export type RawDocument = {
  fileInfo: FileInfo;
  wordDocumentInfo?: WordDocumentInfo; // only available for word files
};

export type UsePdfDocumentReturn = {
  state: PdfDocumentState;
  setState: (newState: PdfDocumentState) => void;
  clearState: () => void;
  document: PDFiumDocument | undefined;
  setDocument: React.Dispatch<React.SetStateAction<PDFiumDocument | undefined>>;
  pageRange: PageRange;
  setPageRange: React.Dispatch<React.SetStateAction<PageRange>>;
  rawDocument: RawDocument | undefined;
  setRawDocument: React.Dispatch<React.SetStateAction<RawDocument | undefined>>;
  thumbnailMeta: ThumbnailMeta | undefined;
  setThumbnailMeta: React.Dispatch<
    React.SetStateAction<ThumbnailMeta | undefined>
  >;
  documentContent: PDFiumDocumentContent | undefined;
  setDocumentContent: React.Dispatch<
    React.SetStateAction<PDFiumDocumentContent | undefined>
  >;
};

const usePdfDocument = (
  initialState?: PdfDocumentState,
): UsePdfDocumentReturn => {
  const [document, setDocument] = useState<PDFiumDocument | undefined>(
    initialState?.document,
  );
  const [documentContent, setDocumentContent] = useState<
    PDFiumDocumentContent | undefined
  >(initialState?.documentContent);
  const [rawDocument, setRawDocument] = useState<RawDocument>();
  const [thumbnailMeta, setThumbnailMeta] = useState<ThumbnailMeta>();
  const [pageRange, setPageRange] = useState<PageRange>(
    initialState?.pageRange || {
      from: 1,
      to: -1,
    },
  );

  const state: PdfDocumentState = {
    document,
    documentContent,
    pageRange,
    rawDocument,
    thumbnailMeta,
  };

  const clearState = useCallback(() => {
    setDocument(undefined);
    setPageRange({
      from: 1,
      to: -1,
    });
    setRawDocument(undefined);
    setThumbnailMeta(undefined);
    setDocumentContent(undefined);
  }, []);

  const setState = useCallback((newState: PdfDocumentState) => {
    setDocument(newState.document);
    setDocumentContent(newState.documentContent);
    setPageRange(newState.pageRange);
    setRawDocument(newState.rawDocument);
    setThumbnailMeta(newState.thumbnailMeta);
  }, []);

  return {
    state,
    setState,
    clearState,
    document,
    setDocument,
    pageRange,
    setPageRange,
    rawDocument,
    setRawDocument,
    thumbnailMeta,
    setThumbnailMeta,
    documentContent,
    setDocumentContent,
  };
};

export default usePdfDocument;
