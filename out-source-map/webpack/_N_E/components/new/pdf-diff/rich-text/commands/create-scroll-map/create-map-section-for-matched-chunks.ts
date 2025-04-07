import PDFiumImage from 'lib/pdfium/image';
import { RichTextDiffChunk } from 'types/rich-text';
import { MapSection } from '.';
import getLowestAndHighest from './get-lowest-and-highest';

export default function createMapSectionForMatchedChunks(
  matchedLeft: RichTextDiffChunk[],
  matchedRight: RichTextDiffChunk[],
  leftImages: PDFiumImage[],
  rightImages: PDFiumImage[],
  currentLeftCursor: number,
  currentRightCursor: number,
  highlight: boolean,
  pageSpacing: number = 0,
): MapSection {
  //Make the map...
  const [lowestYLeft, highestYLeft] =
    matchedLeft.length > 0
      ? getLowestAndHighest(matchedLeft, leftImages, pageSpacing)
      : [currentLeftCursor, currentLeftCursor];

  const [lowestYRight, highestYRight] =
    matchedRight.length > 0
      ? getLowestAndHighest(matchedRight, rightImages, pageSpacing)
      : [currentRightCursor, currentRightCursor];

  const pagesLeft = matchedLeft.map((_) => _.pageIndex).sort();
  const pagesRight = matchedRight.map((_) => _.pageIndex).sort();

  const section: MapSection = {
    ranges: [
      [lowestYLeft, Math.max(highestYLeft, currentLeftCursor)],
      [lowestYRight, Math.max(highestYRight, currentRightCursor)],
    ],
    type: 'matched',
    highlight: highlight ? 'both' : 'none',
    pageStartLeft: pagesLeft.shift() ?? 0,
    pageStartRight: pagesRight.shift() ?? 0,
    pageEndLeft: pagesLeft.pop() ?? 0,
    pageEndRight: pagesRight.pop() ?? 0,
  };

  return section;
}
