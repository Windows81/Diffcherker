import PDFiumImage from 'lib/pdfium/image';
import { RichTextDiffChunk } from 'types/rich-text';
import getPageOffset from './get-page-offset';

export default function getLowestAndHighest(
  chunks: RichTextDiffChunk[],
  images: PDFiumImage[],
  pageSpacing: number = 0,
): [number, number] {
  const boxesAndPositions = chunks
    .map((_) => _.y.flat().map((y) => ({ y, pageNumber: _.pageIndex })))
    .flat();

  const yPositions = boxesAndPositions.map(
    (_) =>
      images[_.pageNumber].height -
      _.y +
      getPageOffset(_.pageNumber, images, pageSpacing),
  );

  yPositions.sort((a, b) => a - b);
  return [yPositions[0], yPositions[yPositions.length - 1]];
}
