import {
  RichTextDiff,
  RichTextDiffChunk,
  RichTextDiffType,
  RichTextDrawingChunk,
  RichTextExportType,
} from 'types/rich-text';
import PDFiumWorker from '../worker-wrapper';
import { PdfDocumentState } from 'lib/hooks/use-diff-document';

const RichTextDiffTypeMap = {
  remove: RichTextDiffType.Remove,
  insert: RichTextDiffType.Insert,
  move: RichTextDiffType.Move,
};

const getRichTextExportData = async (
  exportType: RichTextExportType,
  includeStyleChanges: boolean,
  leftState: PdfDocumentState,
  rightState: PdfDocumentState,
  diffData: RichTextDiff,
): Promise<ArrayBuffer> => {
  if (!leftState.document || !rightState.document) {
    throw new Error('Failed to export. Missing document');
  }
  let rawExportedPDFData: ArrayBuffer;
  // Only these two require creating a new worker, so we combine them.
  if (
    exportType === RichTextExportType.SplitView ||
    exportType === RichTextExportType.Alternating
  ) {
    const leftDrawingChunks = convertRichTextDiffToDrawingChunks(
      diffData.left,
      includeStyleChanges,
    );
    const rightDrawingChunks = convertRichTextDiffToDrawingChunks(
      diffData.right,
      includeStyleChanges,
    );
    const left = await leftState.document.getAnnotatedPDF(
      leftDrawingChunks,
      leftState.pageRange,
    );
    const right = await rightState.document.getAnnotatedPDF(
      rightDrawingChunks,
      rightState.pageRange,
    );
    const exportWorker = new PDFiumWorker();
    await exportWorker.init();
    rawExportedPDFData = await exportWorker.createSplitDocument(
      left,
      right,
      exportType,
    );
    exportWorker.destroy(); // shouldn't need to await this
  } else if (exportType === RichTextExportType.LeftDocument) {
    const leftDrawingChunks = convertRichTextDiffToDrawingChunks(
      diffData.left,
      includeStyleChanges,
    );
    rawExportedPDFData = await leftState.document.getAnnotatedPDF(
      leftDrawingChunks,
      leftState.pageRange,
    );
  } else if (exportType === RichTextExportType.RightDocument) {
    const rightDrawingChunks = convertRichTextDiffToDrawingChunks(
      diffData.right,
      includeStyleChanges,
    );
    rawExportedPDFData = await rightState.document.getAnnotatedPDF(
      rightDrawingChunks,
      rightState.pageRange,
    );
  } else {
    // theoretically should never reach this.
    throw new Error('Failed to export. Invalid option');
  }
  return rawExportedPDFData;
};

const convertRichTextDiffToDrawingChunks = (
  diffDataSide: RichTextDiffChunk[],
  includeStyleChanges: boolean,
): RichTextDrawingChunk[] => {
  const drawingChunks: RichTextDrawingChunk[] = [];
  diffDataSide.forEach((chunk) => {
    if (
      chunk.type === 'equal' &&
      !(chunk.fontFamilyChanged || chunk.fontSizeChanged || chunk.colorChanged)
    ) {
      return;
    } else if (chunk.type === 'equal' && includeStyleChanges) {
      chunk.y.forEach(([top, bottom], index) => {
        const lrPairings = chunk.x[index];
        drawingChunks.push({
          pageIndex: chunk.pageIndex,
          diffType: RichTextDiffType.StyleChange,
          top,
          bottom,
          left: lrPairings[0][0], // left most x
          right: lrPairings[lrPairings.length - 1][1], // right most x
        });
      });
    } else if (
      chunk.type === 'insert' ||
      chunk.type === 'remove' ||
      chunk.type === 'move'
    ) {
      chunk.y.forEach(([top, bottom], index) => {
        const lrPairings = chunk.x[index];
        drawingChunks.push({
          pageIndex: chunk.pageIndex,
          diffType: RichTextDiffTypeMap[chunk.type],
          top,
          bottom,
          left: lrPairings[0][0], // left most x
          right: lrPairings[lrPairings.length - 1][1], // right most x
        });
      });
    }
  });

  return drawingChunks; // Placeholder return statement, replace with your actual implementation
};

export default getRichTextExportData;
