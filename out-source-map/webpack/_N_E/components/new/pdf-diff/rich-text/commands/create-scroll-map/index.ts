import PDFiumImage from 'lib/pdfium/image';
import { DiffSide } from 'types/diffSide';
import createMapSectionForMatchedChunks from './create-map-section-for-matched-chunks';
import createMapSectionForSoloChunks from './create-map-section-for-solo-chunks';
import createNotSameChunksFromNotSameGroup from './create-not-same-chunks-from-not-same-group';
import createSameChunksFromNotSameGroup from './create-same-chunks-from-not-same-group';
import groupNotSameChunksToArray from './group-not-same-chunks-to-array';
import addSectionToScrollMap from './add-section-to-scroll-map';
import { RichTextDiffChunk } from 'types/rich-text';
import getPageOffset from './get-page-offset';
import normalizeScrollMap from './normalize-scroll-map';

export type NotSameGroup = {
  afterSame: number;
  start: number;
  end: number;
  side: DiffSide;
};

export type SectionRange = [start: number, end: number];

export type MapSectionRanges = [
  leftRange: SectionRange,
  rightRange: SectionRange,
];

export type MapSection = {
  ranges: MapSectionRanges;
  type: 'matched' | 'solo';
  highlight: 'left' | 'right' | 'both' | 'none';
  pageStartLeft: number;
  pageStartRight: number;
  pageEndLeft: number;
  pageEndRight: number;
};

export type ScrollMap = {
  sections: MapSection[];
  leftHeight: number;
  rightHeight: number;
};

export default function createScrollMap(
  leftChunks: RichTextDiffChunk[],
  rightChunks: RichTextDiffChunk[],
  leftImages: PDFiumImage[],
  rightImages: PDFiumImage[],
  pageSpacing: number = 0,
): ScrollMap {
  // Initialize data
  const leftChunksSame = leftChunks.filter((_) => _.type === 'equal');
  const rightChunksSame = rightChunks.filter((_) => _.type === 'equal');

  const notSameGroups = groupNotSameChunksToArray(leftChunks, rightChunks);
  notSameGroups.sort((a, b) => a.afterSame - b.afterSame);

  const scrollMap: ScrollMap = { sections: [], leftHeight: 0, rightHeight: 0 };

  // Initialize cursors
  let afterSameCursor = -1; //-1 is used for when the first not notSameGroup is before any similar content
  let currentLeftCursor = 0;
  let currentRightCursor = 0;
  let sameGroupStart = 0;

  notSameGroups.forEach((notSameGroup, index) => {
    // Create map for same
    if (notSameGroup.afterSame > afterSameCursor) {
      // prevents multiple equal maps from being made
      const sameChunksLeft = createSameChunksFromNotSameGroup(
        notSameGroup,
        leftChunksSame,
        sameGroupStart,
      );

      const sameChunksRight = createSameChunksFromNotSameGroup(
        notSameGroup,
        rightChunksSame,
        sameGroupStart,
      );

      const sectionForMap = createMapSectionForMatchedChunks(
        sameChunksLeft,
        sameChunksRight,
        leftImages,
        rightImages,
        currentLeftCursor,
        currentRightCursor,
        false,
        pageSpacing,
      );

      addSectionToScrollMap(scrollMap, sectionForMap);

      //Adjust cursors
      afterSameCursor = notSameGroup.afterSame;
      sameGroupStart = notSameGroup.afterSame + 1;

      // Update cursors with highest values from the latest range map
      currentLeftCursor = sectionForMap.ranges[0][1];
      currentRightCursor = sectionForMap.ranges[1][1];
    }

    // create difference block
    const prevNotSameGroup = notSameGroups[index - 1];
    const isReplacement =
      prevNotSameGroup &&
      prevNotSameGroup.side !== notSameGroup.side &&
      prevNotSameGroup.afterSame === notSameGroup.afterSame;

    if (isReplacement) {
      //remove the previous, and create a new map using the previous and the current one;
      const prevSection = scrollMap.sections.pop();
      if (prevSection) {
        //reset the cursors to the previous
        currentLeftCursor = prevSection.ranges[0][0];
        currentRightCursor = prevSection.ranges[1][0];
      }

      const notSameGroupLeft =
        prevNotSameGroup.side === 'left' ? prevNotSameGroup : notSameGroup;
      const notSameGroupRight =
        prevNotSameGroup.side === 'right' ? prevNotSameGroup : notSameGroup;

      const notSameChunksLeft = createNotSameChunksFromNotSameGroup(
        notSameGroupLeft,
        leftChunks,
      );

      const notSameChunksRight = createNotSameChunksFromNotSameGroup(
        notSameGroupRight,
        rightChunks,
      );

      const sectionForMap = createMapSectionForMatchedChunks(
        notSameChunksLeft,
        notSameChunksRight,
        leftImages,
        rightImages,
        currentLeftCursor,
        currentRightCursor,
        true,
        pageSpacing,
      );

      addSectionToScrollMap(scrollMap, sectionForMap);

      currentLeftCursor = sectionForMap.ranges[0][1];
      currentRightCursor = sectionForMap.ranges[1][1];

      // a left or right change without a match
    } else {
      //Create map for not same group
      const leftOrRightChunks =
        notSameGroup.side === 'left' ? leftChunks : rightChunks;
      const leftOrRightImages =
        notSameGroup.side === 'left' ? leftImages : rightImages;

      const notSameChunks = createNotSameChunksFromNotSameGroup(
        notSameGroup,
        leftOrRightChunks,
      );

      const sectionForMap = createMapSectionForSoloChunks(
        notSameChunks,
        leftOrRightImages,
        notSameGroup.side,
        currentLeftCursor,
        currentRightCursor,
        true,
        pageSpacing,
      );

      addSectionToScrollMap(scrollMap, sectionForMap);

      currentLeftCursor = sectionForMap.ranges[0][1];
      currentRightCursor = sectionForMap.ranges[1][1];
    }

    // Create range at the end if we're finishing with a same group.
    const finishingWithSameGroup =
      index === notSameGroups.length - 1 &&
      notSameGroup.afterSame < leftChunksSame.length - 1;

    if (finishingWithSameGroup) {
      const sameGroupLeft = leftChunksSame.slice(
        notSameGroup.afterSame + 1,
        leftChunksSame.length,
      );
      const sameGroupRight = rightChunksSame.slice(
        notSameGroup.afterSame + 1,
        rightChunksSame.length,
      );

      const rangeForMap = createMapSectionForMatchedChunks(
        sameGroupLeft,
        sameGroupRight,
        leftImages,
        rightImages,
        currentLeftCursor,
        currentRightCursor,
        false,
        pageSpacing,
      );

      addSectionToScrollMap(scrollMap, rangeForMap);
    }
  });

  if (scrollMap.sections.length > 0) {
    // Some bounding boxes can be negative sometimes, clamp to the top of the page
    const firstSection = scrollMap.sections[0];
    const [firstLeftRange, firstRightRange] = firstSection.ranges;
    if (firstLeftRange[0] < 0) {
      firstLeftRange[0] = 0;
    }

    if (firstRightRange[0] < 0) {
      firstRightRange[0] = 0;
    }

    // Fill with a matching range, from zero to the first bounding box
    if (firstLeftRange[0] !== 0 || firstRightRange[0] !== 0) {
      const section: MapSection = {
        ranges: [
          [0, firstLeftRange[0]],
          [0, firstRightRange[0]],
        ],
        type: 'matched',
        highlight: 'none',
        pageStartLeft: 0,
        pageStartRight: 0,
        pageEndLeft: firstSection.pageStartLeft,
        pageEndRight: firstSection.pageStartRight,
      };

      scrollMap.sections.unshift(section);
    }

    // Fill the last bounding box, to the end of the pages
    const lastSection = scrollMap.sections[scrollMap.sections.length - 1];
    const [lastLeftRange, lastRightRange] = lastSection.ranges;

    const section: MapSection = {
      ranges: [
        [
          lastLeftRange[1],
          getPageOffset(leftImages.length, leftImages, pageSpacing) -
            pageSpacing, // no spacing on the last page
        ],
        [
          lastRightRange[1],
          getPageOffset(rightImages.length, rightImages, pageSpacing) -
            pageSpacing, // no spacing on the last page
        ],
      ],
      type: 'matched',
      highlight: 'none',
      pageStartLeft: lastSection.pageEndLeft,
      pageStartRight: lastSection.pageEndRight,
      pageEndLeft: leftImages.length,
      pageEndRight: rightImages.length,
    };

    scrollMap.sections.push(section);
  }

  //Normalize the scroll map into a percentage on each side from 0 - 1;
  return normalizeScrollMap(scrollMap);
}

export function getMappedPosition(
  scrollMap: ScrollMap,
  side: DiffSide | number,
  yPos: number,
) {
  let mappedPosition: number | undefined;

  scrollMap.sections.forEach((section, index) => {
    const from =
      side === 'left' || side === 0 ? section.ranges[0] : section.ranges[1];
    const to =
      side === 'left' || side === 1 ? section.ranges[1] : section.ranges[0];

    const [lowestYFrom, highestYFrom] = from;
    const [lowestYTo, highestYTo] = to;

    if (
      yPos >= lowestYFrom &&
      yPos <= highestYFrom &&
      mappedPosition === undefined
    ) {
      const percentage =
        (yPos - lowestYFrom) / (highestYFrom - lowestYFrom || 1);
      console.debug('percentage map on index', index, 'is %', percentage);
      console.debug('section: ', section);
      if (index > 0) {
        console.debug('prev-section: ', scrollMap.sections[index - 1]);
      }
      mappedPosition = percentage * (highestYTo - lowestYTo) + lowestYTo;
      console.debug('mapping yPos', yPos, 'to', mappedPosition);
    }
  });

  return mappedPosition ?? yPos;
}
