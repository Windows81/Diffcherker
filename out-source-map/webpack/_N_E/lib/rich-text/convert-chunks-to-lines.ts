import { PDFiumChunk } from 'lib/pdfium/messages';

const checkSameLine = (x: [number, number], y: [number, number]) => {
  const wiggleRoom = 6;
  return (
    (x[0] - y[0] > 0 &&
      x[0] - y[0] < wiggleRoom &&
      y[1] - x[1] > -10 &&
      y[1] - x[1] < wiggleRoom) ||
    (x[0] == y[0] && x[1] == y[1]) ||
    (y[0] - x[0] > 0 &&
      y[0] - x[0] < wiggleRoom &&
      x[1] - y[1] > 0 &&
      x[1] - y[1] < wiggleRoom)
  );
};

const convertChunksToLines = (pagesOfChunks: PDFiumChunk[][]): string => {
  let text = '';
  let isNewLine = false;
  for (const pageChunks of pagesOfChunks) {
    for (let i = 0; i < pageChunks.length; i++) {
      // combine chunks that only differ in styling, should be doing this in the
      // worker but this is a temporary solution for now.
      const lastParagraphLastLine =
        pageChunks[i - 1]?.y[pageChunks[i - 1].y.length - 1];
      if (
        lastParagraphLastLine &&
        checkSameLine(pageChunks[i].y[0], lastParagraphLastLine)
      ) {
        isNewLine = false;
      }
      text += (isNewLine ? '\n' : '') + pageChunks[i].text.join('');
      isNewLine = true;
    }
  }
  return text;
};

export default convertChunksToLines;
