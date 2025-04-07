import PDFiumImage from 'lib/pdfium/image';
import { RichTextDiffChunk } from 'types/rich-text';
import { DiffSide } from 'types/diffSide';
import { MapSection, MapSectionRanges } from '.';
import getLowestAndHighest from './get-lowest-and-highest';

export default function createMapSectionForSoloChunks(
  chunks: RichTextDiffChunk[],
  images: PDFiumImage[],
  side: DiffSide,
  currentLeftCursor: number,
  currentRightCursor: number,
  highlight: boolean,
  pageSpacing: number = 0,
): MapSection {
  const [lowestY, highestY] = getLowestAndHighest(chunks, images, pageSpacing);

  let ranges: MapSectionRanges;
  if (side === 'left') {
    ranges = [
      [lowestY, Math.max(highestY, currentLeftCursor)],
      [currentRightCursor, currentRightCursor],
    ];
  } else {
    ranges = [
      [currentLeftCursor, currentLeftCursor],
      [lowestY, Math.max(highestY, currentRightCursor)],
    ];
  }

  const pages = chunks.map((_) => _.pageIndex).sort();

  return {
    ranges,
    type: 'solo',
    highlight: highlight ? side : 'none',
    pageEndLeft: pages.pop() ?? 0, // One of these (left or right) needs a correct cursor
    pageEndRight: pages.pop() ?? 0,
    pageStartLeft: pages.shift() ?? 0, // One of these (left or right) needs a correct cursor
    pageStartRight: pages.shift() ?? 0,
  };
}
