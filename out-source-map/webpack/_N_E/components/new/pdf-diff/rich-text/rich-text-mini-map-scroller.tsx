/* eslint-disable jsx-a11y/no-static-element-interactions */
import PDFiumImage from 'lib/pdfium/image';
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from 'react';
import { DiffSide } from 'types/diffSide';
import { RichTextDiffChunk } from 'types/rich-text';
import useResizeObserver from 'use-resize-observer';
import { getMappedPosition, ScrollMap } from './commands/create-scroll-map';
import getPageOffset from './commands/create-scroll-map/get-page-offset';
import { NotSameGroupByOptions } from './commands/create-scroll-map/group-not-same-chunks-to-array';
import { RichTextMiniMapMemo } from './rich-text-mini-map';
import css from './rich-text-mini-map-scroller.module.css';

const MIN_HANDLE_HEIGHT = 24;

interface RichTextScrollMapScrollerProps {
  chunkCollections: RichTextDiffChunk[][];
  imageCollections: PDFiumImage[][];
  scrollMap: ScrollMap;
  pageSpacing: number;
  viewPercentage: number;
  scrollTopPercentage: number;
  notSameFilter?: NotSameGroupByOptions;
  side?: DiffSide;
  onScrollChange?: (percentage: number) => void;
  onWheel?: (wheelEvent: WheelEvent<HTMLDivElement>) => void;
}

const RichTextMiniMapScroller: React.FC<RichTextScrollMapScrollerProps> = ({
  chunkCollections,
  imageCollections,
  scrollMap,
  pageSpacing,
  viewPercentage,
  scrollTopPercentage,
  notSameFilter,
  side,
  onScrollChange,
  onWheel,
}) => {
  //Clamp view percentage...
  viewPercentage = useMemo(() => Math.min(viewPercentage, 1), [viewPercentage]);

  const [dragging, setDragging] = useState<boolean>(false);
  const [mouseHandleOffset, setMouseHandleOffset] = useState<number>(0);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollHandle = useRef<HTMLDivElement>(null);

  const { height: scrollerHeight = 0 } = useResizeObserver<HTMLDivElement>({
    ref: scrollerRef,
  });

  /**
   * Gets the most up to date scrollbar height when the element is resized
   */
  const currScrollerHeight = useMemo(
    () =>
      scrollerRef.current?.getBoundingClientRect().height ??
      scrollerHeight ??
      0,
    [scrollerHeight],
  );

  /**
   * Original values before any mutations, used for various calculations
   */
  const ogViewPercentage = useMemo(() => viewPercentage, [viewPercentage]);
  const ogHandleHeight = useMemo(
    () => viewPercentage * currScrollerHeight,
    [currScrollerHeight, viewPercentage],
  );
  const ogHandleTop = useMemo(
    () =>
      Math.min(
        scrollTopPercentage * currScrollerHeight,
        currScrollerHeight - ogHandleHeight,
      ),
    [currScrollerHeight, ogHandleHeight, scrollTopPercentage],
  ); // make sure the height can't exceed the bounds, javascript fp math can give a spurious result for the position sometimes.)

  /**
   * Handle dimensions/offset
   */
  const handleHeight = useMemo(
    () => Math.max(viewPercentage * currScrollerHeight, MIN_HANDLE_HEIGHT),
    [currScrollerHeight, viewPercentage],
  );
  const handleHeightOffset = useMemo(() => {
    // Calculate some necessary values for scroll handle, which also supports a minimum scroll handle height.

    // Scale the offset relative to the position of the handle so that the handle
    // doesn't overshoot the bottom with the new minimum height
    const scrollEnd = currScrollerHeight - handleHeight;
    const scrollablePercentage = ogHandleTop / scrollEnd;
    return (
      Math.max(MIN_HANDLE_HEIGHT - ogHandleHeight, 0) * scrollablePercentage
    );
  }, [currScrollerHeight, handleHeight, ogHandleHeight, ogHandleTop]);
  const handleTop = useMemo(() => {
    // Apply the offset to ensure no overshoot with a bigger than potentially normal handle size.
    return ogHandleTop - handleHeightOffset;
  }, [handleHeightOffset, ogHandleTop]);

  /**
   * Default filter settings for the minimap
   */
  notSameFilter = useMemo(
    () => notSameFilter ?? { content: true },
    [notSameFilter],
  );

  const getRelativeYFromMouseY = useCallback(
    (mouseY: number, mouseHandleOffset: number) => {
      if (scrollerRef.current && scrollHandle.current) {
        const scrollerRect = scrollerRef.current.getBoundingClientRect();

        const y =
          mouseY - mouseHandleOffset - scrollerRect.top + handleHeightOffset;
        return Math.min(Math.max(y, 0), scrollerRect.height);
      } else {
        return mouseY;
      }
    },
    [handleHeightOffset],
  );

  const onMouseDownContainer = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
      if (e.target === scrollHandle.current) {
        return;
      }

      setDragging(true);

      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (scrollerRef.current && scrollHandle.current) {
        const scrollerRect = scrollerRef.current.getBoundingClientRect();
        const scrollHandleRect = scrollHandle.current.getBoundingClientRect();

        const mouseHandleOffset = Math.min(
          scrollHandleRect.height / 2,
          clientY - scrollerRect.top,
        );

        const maxPercentage =
          (scrollerRect.height - scrollHandleRect.height) / scrollerRect.height;

        setMouseHandleOffset(mouseHandleOffset);

        onScrollChange &&
          onScrollChange(
            Math.min(
              getRelativeYFromMouseY(clientY, mouseHandleOffset) /
                scrollerRect.height,
              maxPercentage,
            ),
          );
      }
    },
    [getRelativeYFromMouseY, onScrollChange],
  );

  const onMouseDown = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
      setDragging(true);
      if (scrollHandle.current && scrollerRef.current) {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const scrollHandleRect = scrollHandle.current.getBoundingClientRect();
        const scrollerRect = scrollerRef.current.getBoundingClientRect();
        const mouseHandleOffset = clientY - scrollHandleRect.top;

        setMouseHandleOffset(mouseHandleOffset);

        onScrollChange &&
          onScrollChange(
            getRelativeYFromMouseY(clientY, mouseHandleOffset) /
              scrollerRect.height,
          );
      }
    },
    [getRelativeYFromMouseY, onScrollChange],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (dragging && scrollerRef.current) {
        onScrollChange &&
          onScrollChange(
            getRelativeYFromMouseY(clientY, mouseHandleOffset) /
              (scrollerHeight - handleHeightOffset),
          );
      }
    },
    [
      dragging,
      getRelativeYFromMouseY,
      handleHeightOffset,
      mouseHandleOffset,
      onScrollChange,
      scrollerHeight,
    ],
  );

  const handleWheel = useMemo(
    () => (e: Event) => {
      onWheel && onWheel(e as unknown as WheelEvent<HTMLDivElement>);
    },
    [onWheel],
  );

  const onMouseUp = useMemo(
    () => () => {
      setDragging(false);
    },
    [],
  );

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchend', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onMouseMove);
    } else {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onMouseMove);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  useEffect(() => {
    let div: HTMLDivElement;
    if (scrollerRef.current) {
      scrollerRef.current.addEventListener('wheel', handleWheel, {
        passive: false,
      });

      div = scrollerRef.current;
    }

    return () => {
      div.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const scrollHandleStyle: CSSProperties = useMemo(() => {
    return {
      top: `${handleTop}px`,
      height: `${handleHeight}px`,
      position: 'absolute',
    };
  }, [handleTop, handleHeight]);

  const mapLengths = useMemo(
    () =>
      imageCollections.map((images) =>
        getPageOffset(images.length, images, pageSpacing),
      ),
    [imageCollections, pageSpacing],
  );

  const longestMap = useMemo(() => Math.max(...mapLengths) ?? 0, [mapLengths]);

  const mapScales = useMemo(() => {
    return mapLengths.map((length, index) => {
      const mapTo = index === 0 ? 'left' : 'right';

      // Ensure localWindow doesn't exceed the current map length
      const localWindow = Math.min(viewPercentage * longestMap, length);

      // Calculate percentage without risk of going negative
      const maxPercentage = (length - localWindow) / length;

      // Adjust the scaling factor to prevent inversion
      const scaleFactor = Math.max(1, localWindow / length);

      const mappedPosition =
        getMappedPosition(scrollMap, mapTo, maxPercentage) * scaleFactor;

      return length !== longestMap ? mappedPosition : 1;
    }, []);
  }, [longestMap, mapLengths, scrollMap, viewPercentage]);

  return (
    <div
      ref={scrollerRef}
      tabIndex={0}
      role="scrollbar"
      aria-controls="content1"
      aria-orientation="vertical"
      aria-valuemax={1}
      aria-valuemin={0}
      aria-valuenow={scrollTopPercentage / (1 - viewPercentage)}
      className={css.container}
      style={{
        maxHeight:
          viewPercentage == 1 ? `${(1 / ogViewPercentage) * 100}%` : '',
        minHeight:
          viewPercentage == 1 ? `${(1 / ogViewPercentage) * 100}%` : '',
      }}
      onMouseDown={onMouseDownContainer}
      onTouchStart={onMouseDownContainer}
    >
      {viewPercentage < 1 && (
        <div
          className={css.scrollHandle}
          ref={scrollHandle}
          style={scrollHandleStyle}
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
        />
      )}
      {chunkCollections.map((chunks, index) => (
        <RichTextMiniMapMemo
          key={index}
          side={side || (index === 0 ? 'left' : 'right')}
          scale={mapScales[index]}
          chunks={chunks}
          images={imageCollections[index]}
          pageSpacing={pageSpacing}
          notSameFilter={notSameFilter}
        />
      ))}
    </div>
  );
};

export default RichTextMiniMapScroller;
