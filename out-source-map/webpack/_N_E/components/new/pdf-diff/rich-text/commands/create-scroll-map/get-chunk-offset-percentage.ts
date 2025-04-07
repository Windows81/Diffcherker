import PDFiumImage from 'lib/pdfium/image';
import getPageOffset from './get-page-offset';
import { RichTextDiffChunk } from 'types/rich-text';

export function getChunkOffsetPercentage(
  chunk: RichTextDiffChunk,
  images: PDFiumImage[],
  pageSpacing: number = 0,
): number {
  const pageOffset = getPageOffset(chunk.pageIndex, images, pageSpacing);

  const chunksPageOffset = images[chunk.pageIndex].height - chunk.y[0][0];

  const totalHeight = getPageOffset(images.length, images, pageSpacing);

  return (pageOffset + chunksPageOffset) / totalHeight;
}
