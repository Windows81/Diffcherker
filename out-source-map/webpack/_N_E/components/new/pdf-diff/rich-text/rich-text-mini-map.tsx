import cx from 'classnames';
import PDFiumImage from 'lib/pdfium/image';
import { memo, useCallback, useMemo, useRef } from 'react';
import { DiffSide } from 'types/diffSide';
import { RichTextDiffChunk } from 'types/rich-text';
import useResizeObserver from 'use-resize-observer';
import getLowestAndHighest from './commands/create-scroll-map/get-lowest-and-highest';
import getPageOffset from './commands/create-scroll-map/get-page-offset';
import {
  isChunkNotSame,
  NotSameGroupByOptions,
} from './commands/create-scroll-map/group-not-same-chunks-to-array';
import css from './rich-text-mini-map.module.css';

interface RichTextScrollMapProps {
  chunks: RichTextDiffChunk[];
  images: PDFiumImage[];
  pageSpacing: number;
  scale: number;
  notSameFilter: NotSameGroupByOptions;
  side: DiffSide;
}

const getColorClass = (
  chunk: RichTextDiffChunk,
  notSameFilter: NotSameGroupByOptions,
  side: DiffSide,
) => {
  if (chunk.type === 'move') {
    return css.moveColor;
  }

  if (notSameFilter.content && chunk.type !== 'equal') {
    return side === 'left' ? css.deleteColor : css.insertColor;
  }

  if (chunk.type === 'equal') {
    return (notSameFilter.color && chunk.colorChanged) ||
      (notSameFilter.fontFamily && chunk.fontFamily) ||
      (notSameFilter.fontSize && chunk.fontSize)
      ? css.formattingColor
      : undefined;
  }
};

const RichTextMiniMap: React.FC<RichTextScrollMapProps> = ({
  chunks,
  images,
  pageSpacing,
  scale,
  notSameFilter,
  side,
}) => {
  const height = getPageOffset(images.length, images, pageSpacing);
  const containerRef = useRef<HTMLDivElement>(null);

  const { height: minimapHeight = 0 } = useResizeObserver<HTMLDivElement>({
    ref: containerRef,
  });

  const getHeightAndTop = useCallback(
    (chunk: RichTextDiffChunk) => {
      const [start, end] = getLowestAndHighest([chunk], images, pageSpacing);

      const divHeight = ((end - start) / height) * minimapHeight * scale;
      const divTop = Math.round((start / height) * minimapHeight * scale);
      const roundedDivHeight = Math.max(divHeight, 2);

      return { divHeight, divTop, roundedDivHeight };
    },
    [height, images, minimapHeight, pageSpacing, scale],
  );

  const isChunkAlreadyHighlighted = useCallback(
    (chunk: RichTextDiffChunk, highlightCache: Set<string>) => {
      const { divTop, roundedDivHeight } = getHeightAndTop(chunk);
      return highlightCache.has(
        `${getColorClass(chunk, notSameFilter, side)}-${roundedDivHeight}-${divTop}`,
      );
    },
    [getHeightAndTop, notSameFilter, side],
  );

  const markChunkHighlighted = useCallback(
    (chunk: RichTextDiffChunk, highlightCache: Set<string>) => {
      const { divTop, roundedDivHeight } = getHeightAndTop(chunk);
      highlightCache.add(
        `${getColorClass(chunk, notSameFilter, side)}-${roundedDivHeight}-${divTop}`,
      );
    },
    [getHeightAndTop, notSameFilter, side],
  );

  /**
   * This, and the code above, culls any similar chunks that are overlapping
   * to place an upper bound on how many chunks are displayed in this map.
   */
  const displayChunks = useMemo(() => {
    const highlightCache = new Set<string>();

    return chunks.filter((c) => {
      const shouldShow =
        isChunkNotSame(c, notSameFilter) &&
        !isChunkAlreadyHighlighted(c, highlightCache);
      markChunkHighlighted(c, highlightCache);
      return shouldShow;
    });
  }, [chunks, isChunkAlreadyHighlighted, markChunkHighlighted, notSameFilter]);

  return (
    <div className={css.container} ref={containerRef}>
      {displayChunks.map((chunk, index) => {
        const { divTop, roundedDivHeight } = getHeightAndTop(chunk);

        return (
          <div
            key={index}
            className={cx(
              css.change,
              getColorClass(chunk, notSameFilter, side),
            )}
            style={{
              height: `${roundedDivHeight}px`,
              top: `${divTop}px`,
            }}
          />
        );
      })}
    </div>
  );
};

export const RichTextMiniMapMemo = memo(
  RichTextMiniMap,
  (prevProps, nextProps) => {
    return (
      prevProps.chunks === nextProps.chunks &&
      prevProps.images === nextProps.images &&
      prevProps.scale === nextProps.scale
    );
  },
);

export default RichTextMiniMap;
