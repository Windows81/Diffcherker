import useLayoutEffectStateUpdate from 'lib/hooks/use-layout-effect-state-update';
import PDFiumImage from 'lib/pdfium/image';
import { RichTextDiffChunk } from 'types/rich-text';
import { RichTextSearchResult } from 'lib/search/rich-text-fuse-searcher';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DiffSide } from 'types/diffSide';
import css from './rich-text-page.module.css';
import cx from 'classnames';
import { getSvgRectDimensions, LineTspans } from '../pdf-display/pdf-page-text';

interface RichTextDisplayedChunk {
  chunk: RichTextDiffChunk;
  isSelected: boolean;
  isHovered: boolean;
  onChunkClick: (chunkId: number, event?: React.MouseEvent) => void;
  onChunkHover: (chunkId: number) => void;
  pageHeight: number;
  showFontFamilyChanges: boolean;
  showFontSizeChanges: boolean;
  showColorChanges: boolean;
  showText: boolean;
}

const RichTextDisplayedChunk: React.FC<RichTextDisplayedChunk> = ({
  chunk,
  isSelected,
  isHovered,
  onChunkClick,
  onChunkHover,
  pageHeight,
  showFontFamilyChanges,
  showFontSizeChanges,
  showColorChanges,
  showText,
}) => {
  const equalWithoutChangesToShow = useMemo(
    () =>
      chunk.type === 'equal' &&
      !(
        (showFontFamilyChanges && chunk.fontFamilyChanged) ||
        (showFontSizeChanges && chunk.fontSizeChanged) ||
        (showColorChanges && chunk.colorChanged)
      ),
    [chunk, showColorChanges, showFontFamilyChanges, showFontSizeChanges],
  );

  const polygon = useMemo(() => {
    return (
      <>
        {chunk.x.map((x, i) => (
          <RichTextRectangle
            key={`rect${i}`}
            top={chunk.y[i][0]}
            bottom={chunk.y[i][1]}
            left={x[0][0]}
            right={x[x.length - 1][1]}
            pageHeight={pageHeight}
          />
        ))}
      </>
    );
  }, [chunk, pageHeight]);

  const text = useMemo(() => {
    return (
      <text>
        {chunk.text.map((line, j) => (
          <LineTspans
            key={`line-${j}`}
            line={line}
            y={chunk.y[j]}
            x={chunk.x[j]}
            fontSize={chunk.fontSize}
            pageHeight={pageHeight}
          />
        ))}
      </text>
    );
  }, [chunk, pageHeight]);

  return (
    <g
      className={cx(
        css[chunk.type],
        {
          [css.selected]: isSelected,
          [css.hovered]: isHovered,
          [css.hideStyles]: equalWithoutChangesToShow,
        },
        `rich-text-chunk-${chunk.id}`,
      )}
      onClick={(event) => onChunkClick(chunk.id, event)}
      onMouseEnter={() => onChunkHover(chunk.id)}
      onMouseLeave={() => onChunkHover(-1)}
    >
      {polygon}
      {showText && text}
    </g>
  );
};

const RichTextDisplayedChunkMemo = memo(
  RichTextDisplayedChunk,
  (prevProps, nextProps) => {
    const useCache =
      prevProps.chunk === nextProps.chunk &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.onChunkClick === nextProps.onChunkClick &&
      prevProps.onChunkHover === nextProps.onChunkHover &&
      prevProps.pageHeight === nextProps.pageHeight &&
      prevProps.showFontFamilyChanges === nextProps.showFontFamilyChanges &&
      prevProps.showFontSizeChanges === nextProps.showFontSizeChanges &&
      prevProps.showColorChanges === nextProps.showColorChanges;

    return useCache;
  },
);

interface RichTextRectangleProps {
  top: number;
  bottom: number;
  left: number;
  right: number;
  pageHeight: number;
}

const RichTextRectangle: React.FC<RichTextRectangleProps> = ({
  top,
  bottom,
  left,
  right,
  pageHeight,
}) => {
  const rect = useMemo(
    () => getSvgRectDimensions([top, bottom], [left, right], pageHeight),
    [bottom, left, pageHeight, right, top],
  );
  return <rect {...rect} />;
};

interface Rectangle {
  y: [top: number, bottom: number];
  x: [left: number, right: number];
}

const getRectanglesFromPageChunks = (
  chunks: RichTextDiffChunk[],
  startIndex: number,
  endIndex: number,
) => {
  const y = chunks.map((chunk) => chunk.y).flat();
  const x = chunks.map((chunk) => chunk.x).flat();

  const rectangles: Rectangle[] = [];

  let yIndex = 0;
  let xIndex = 0;

  let charsPassed = 0;

  while (charsPassed < startIndex) {
    const numCharsInLine = x[yIndex].length;
    if (charsPassed + numCharsInLine <= startIndex) {
      charsPassed += numCharsInLine;
      yIndex++;
      xIndex = 0;
    } else {
      xIndex += startIndex - charsPassed;
      charsPassed = startIndex;
    }
  }

  while (charsPassed < endIndex) {
    const numCharsInLine = x[yIndex].length;
    const numCharsInLineFromIndex = numCharsInLine - xIndex;

    if (charsPassed + numCharsInLineFromIndex <= endIndex) {
      rectangles.push({
        y: y[yIndex],
        x: [x[yIndex][xIndex][0], x[yIndex][numCharsInLine - 1][1]],
      });
      charsPassed += numCharsInLineFromIndex;
      yIndex++;
      xIndex = 0;
    } else {
      rectangles.push({
        y: y[yIndex],
        x: [
          x[yIndex][xIndex][0],
          x[yIndex][xIndex + endIndex - charsPassed][1],
        ],
      });
      charsPassed = endIndex;
    }
  }

  return rectangles;
};

interface RichTextPageProps {
  pageNumber: number;
  side: DiffSide;
  chunks: RichTextDiffChunk[];
  image: PDFiumImage;
  height: number;
  showFontFamilyChanges: boolean;
  showFontSizeChanges: boolean;
  showColorChanges: boolean;
  hideTextLayer?: boolean;
  deferTextLayer?: boolean;
  searchResults?: RichTextSearchResult[];
  highlightSearchResult?: RichTextSearchResult;
  selectedChunkId: number;
  onChunkClick: (chunkId: number, event?: React.MouseEvent) => void;
  hoveredChunkId: number;
  onChunkHover: (chunkId: number) => void;
}

const RichTextPage: React.FC<RichTextPageProps> = ({
  pageNumber,
  side,
  chunks,
  image,
  height,
  showFontFamilyChanges,
  showFontSizeChanges,
  showColorChanges,
  hideTextLayer,
  deferTextLayer,
  searchResults,
  highlightSearchResult,
  selectedChunkId,
  onChunkClick,
  hoveredChunkId,
  onChunkHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDeferringTextLayer, setIsDeferringTextLayer] = useState<boolean>(
    deferTextLayer ?? false,
  );

  useLayoutEffectStateUpdate(() => {
    if (!deferTextLayer) {
      setIsDeferringTextLayer(false);
    }
  }, [deferTextLayer]);

  const searchHighlightSvg = useMemo(() => {
    const result = highlightSearchResult;
    if (
      result &&
      result.matchRange.length &&
      result.item.pageNumber === pageNumber
    ) {
      return getRectanglesFromPageChunks(
        chunks,
        result.matchRange[0],
        result.matchRange[1],
      ).map((rect, rectIndex) => (
        <rect
          className={cx(css.resultHighlight, 'rich-text-search-highlight')}
          key={`${rectIndex}-char${rectIndex}`}
          {...getSvgRectDimensions(rect.y, rect.x, image.height)}
        />
      ));
    }
  }, [chunks, highlightSearchResult, image.height, pageNumber]);

  const searchResultsSvg = useMemo(() => {
    if (searchResults) {
      return searchResults
        .filter(
          (result) =>
            result.matchRange?.length &&
            result.item.pageNumber === pageNumber &&
            result.item.side === side &&
            result !== highlightSearchResult,
        )
        .map((result) =>
          getRectanglesFromPageChunks(
            chunks,
            result.matchRange[0],
            result.matchRange[1],
          ),
        )
        .flat()
        .map((rect, rectIndex) => (
          <rect
            className={cx(css.highlight)}
            key={`${rectIndex}-char${rectIndex}`}
            {...getSvgRectDimensions(rect.y, rect.x, image.height)}
          />
        ));
    }
  }, [
    chunks,
    highlightSearchResult,
    image.height,
    pageNumber,
    searchResults,
    side,
  ]);

  useLayoutEffect(() => {
    const timeoutId = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      image.streamOnCanvas(canvas);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [image]);

  const canvasLayer = useMemo(() => {
    return (
      <canvas
        ref={canvasRef}
        width={image.canvasWidth}
        height={image.canvasHeight}
      />
    );
  }, [image.canvasHeight, image.canvasWidth]);

  const svgChunks = useMemo(() => {
    return chunks.map((chunk, i) => (
      <RichTextDisplayedChunkMemo
        key={i}
        chunk={chunk}
        isSelected={selectedChunkId === chunk.id}
        isHovered={hoveredChunkId === chunk.id}
        onChunkClick={onChunkClick}
        onChunkHover={onChunkHover}
        pageHeight={image.height}
        showFontFamilyChanges={showFontFamilyChanges}
        showFontSizeChanges={showFontSizeChanges}
        showColorChanges={showColorChanges}
        showText={!hideTextLayer && !isDeferringTextLayer}
      />
    ));
  }, [
    chunks,
    hideTextLayer,
    hoveredChunkId,
    image.height,
    isDeferringTextLayer,
    onChunkClick,
    onChunkHover,
    selectedChunkId,
    showColorChanges,
    showFontFamilyChanges,
    showFontSizeChanges,
  ]);

  const svgLayer = useMemo(() => {
    const viewBox = `0 0 ${image.width} ${image.height}`;
    return (
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
        {searchHighlightSvg && searchHighlightSvg}
        {searchResultsSvg && searchResultsSvg}
        {svgChunks}
      </svg>
    );
  }, [
    image.height,
    image.width,
    searchHighlightSvg,
    searchResultsSvg,
    svgChunks,
  ]);

  return (
    <div
      className={cx(css.page, 'diffchecker-rich-text-page')}
      style={{ width: height * (image.canvasWidth / image.canvasHeight) }} //
    >
      <div className={css.loader} />
      {canvasLayer}
      {svgLayer}
    </div>
  );
};

export default RichTextPage;

/**
 * An optimized version of RichTextPage to prevent aggressive
 * rerendering by React.
 */
export const RichTextPageMemo = memo(RichTextPage, (prevProps, nextProps) => {
  const useCache =
    prevProps.side === nextProps.side &&
    prevProps.pageNumber === nextProps.pageNumber &&
    prevProps.chunks === nextProps.chunks &&
    prevProps.image === nextProps.image &&
    prevProps.height === nextProps.height &&
    prevProps.showFontFamilyChanges === nextProps.showFontFamilyChanges &&
    prevProps.showFontSizeChanges === nextProps.showFontSizeChanges &&
    prevProps.showColorChanges === nextProps.showColorChanges &&
    prevProps.hideTextLayer === nextProps.hideTextLayer &&
    prevProps.searchResults === nextProps.searchResults &&
    prevProps.highlightSearchResult === nextProps.highlightSearchResult &&
    prevProps.deferTextLayer === nextProps.deferTextLayer &&
    prevProps.selectedChunkId === nextProps.selectedChunkId &&
    prevProps.onChunkClick === nextProps.onChunkClick &&
    prevProps.hoveredChunkId === nextProps.hoveredChunkId &&
    prevProps.onChunkHover === nextProps.onChunkHover;

  return useCache;
});
