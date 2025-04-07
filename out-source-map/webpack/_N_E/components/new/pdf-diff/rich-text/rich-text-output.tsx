import DiffSearch from 'components/new/text-diff-output/diff-search';
import SimpleVirtualizedList, {
  SimpleVirtualizedListApi,
} from 'components/shared/simple-virtualized-list';
import { useHotkeys } from 'lib/hooks/use-hotkeys';
import { useIsWindowResizing } from 'lib/hooks/use-is-window-resizing';

import cx from 'classnames';
import IconButton from 'components/shared/icon-button';
import LockedChainSvg from 'components/shared/icons/locked-chain.svg';
import UnlockedChainSvg from 'components/shared/icons/unlocked-chain.svg';
import { useIsOverflow } from 'lib/hooks/use-is-overflow';
import PDFiumImage, { NullPDFiumImage } from 'lib/pdfium/image';
import groupTextIntoPages from 'lib/rich-text/group-text-into-pages';
import RightTextFuseSearcher, {
  RichTextSearchResult,
} from 'lib/search/rich-text-fuse-searcher';
import {
  ForwardedRef,
  forwardRef,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DiffSide } from 'types/diffSide';
import { RichTextDiffChunk } from 'types/rich-text';
import useResizeObserver from 'use-resize-observer';
import createScrollMap, {
  getMappedPosition,
} from './commands/create-scroll-map';
import { getChunkOffsetPercentage } from './commands/create-scroll-map/get-chunk-offset-percentage';
import getScaleFactorsForImage from './commands/create-scroll-map/get-scale-factors-for-image';
import RichTextMiniMapScroller from './rich-text-mini-map-scroller';
import RichTextOutputPageHeader from './rich-text-output-page-header';
import { ZoomTypeOption } from 'types/zoom-type-option';
import css from './rich-text-output.module.css';
import { RichTextPageMemo } from './rich-text-page';

export const SCROLLBAR_WIDTH = 15;
export const PAGE_SPACING = 15;
export const VERTICAL_ALIGN_OFFSET_PERCENTAGE = 0.25;

interface RichTextOutputProps {
  leftImages: PDFiumImage[];
  rightImages: PDFiumImage[];
  leftChunks: RichTextDiffChunk[];
  rightChunks: RichTextDiffChunk[];
  showFontFamilyChanges: boolean;
  showFontSizeChanges: boolean;
  showColorChanges: boolean;
  selectedChunkId: number;
  hoveredChunkId: number;
  onChunkClick: (chunkId: number, event?: React.MouseEvent) => void;
  onChunkHover: (chunkId: number) => void;
  isScrollLocked: boolean;
  setIsScrollLocked: (value: SetStateAction<boolean>) => void;
  setSelectedChunkId: (chunkId: number) => void;
}

export type RichTextOutputApi = {
  scrollToChunk: (chunkId: number) => void;
};

const RichTextOutput = (
  {
    leftImages,
    rightImages,
    leftChunks,
    rightChunks,
    showFontFamilyChanges = true,
    showFontSizeChanges = true,
    showColorChanges = true,
    selectedChunkId,
    onChunkClick,
    hoveredChunkId,
    onChunkHover,
    isScrollLocked,
    setIsScrollLocked,
    setSelectedChunkId,
  }: RichTextOutputProps,
  ref: ForwardedRef<RichTextOutputApi>,
) => {
  // Refs and observer for resizing, in order to ensure the container width is even
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !wrapperRef.current) {
      return;
    }

    const resize = () => {
      if (containerRef.current && wrapperRef.current) {
        const currentWidth = Math.floor(wrapperRef.current.clientWidth);
        const width = currentWidth % 2 === 0 ? currentWidth : currentWidth - 1;

        containerRef.current.style.width = `${width}px`;
      }
    };

    resize();
    observerRef.current = new ResizeObserver(resize);
    observerRef.current.observe(wrapperRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const leftPages = useMemo(
    () => groupTextIntoPages(leftChunks, leftImages.length),
    [leftChunks, leftImages.length],
  );
  const rightPages = useMemo(
    () => groupTextIntoPages(rightChunks, rightImages.length),
    [rightChunks, rightImages.length],
  );

  const leftVirtualizedApi = useRef<SimpleVirtualizedListApi>(null);
  const rightVirtualizedApi = useRef<SimpleVirtualizedListApi>(null);

  // Tracks if the scroller's have scroll bars
  const isScrollbarVisibleLeft = useIsOverflow(
    leftVirtualizedApi.current?.scrollFrameRef,
  );
  const isScrollbarVisibleRight = useIsOverflow(
    leftVirtualizedApi.current?.scrollFrameRef,
  );

  // Search state variables
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<RichTextSearchResult[]>(
    [],
  );
  const [searchIndex, setSearchIndex] = useState<number>(0);
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const [leftScrollPercentage, setLeftScrollPercentage] = useState<number>(0);
  const [rightScrollPercentage, setRightScrollPercentage] = useState<number>(0);

  // Page number tracking variables
  const [currentLeftPageNumber, setCurrentLeftPageNumber] = useState<number>(1);
  const [currentRightPageNumber, setCurrentRightPageNumber] =
    useState<number>(1);

  const [isLeftAtEnd, setIsLeftAtEnd] = useState<boolean>(false);
  const [isRightAtEnd, setIsRightAtEnd] = useState<boolean>(false);

  const [viewPercentage, setViewPercentage] = useState<number>(0.1);
  const [leftViewPercentage, setLeftViewPercentage] = useState<number>(0.1);
  const [rightViewPercentage, setRightViewPercentage] = useState<number>(0.1);
  const [longestDocument, setLongestDocument] =
    useState<RefObject<SimpleVirtualizedListApi>>(leftVirtualizedApi);

  const [zoomType, setZoomType] = useState<ZoomTypeOption>({
    label: 'Automatic Zoom',
    value: 'auto',
  });

  // Resizing and container size state tracking variables
  const isResizing = useIsWindowResizing();
  const {
    ref: refLeft,
    width: widthLeftContainer,
    height: heightLeftContainer,
  } = useResizeObserver<HTMLDivElement>();
  const {
    ref: refRight,
    width: widthRightContainer,
    height: heightRightContainer,
  } = useResizeObserver<HTMLDivElement>();

  let widthLeft = widthLeftContainer ?? 0;
  let widthRight = widthRightContainer ?? 0;
  const heightLeft = heightLeftContainer ?? 0;
  const heightRight = heightRightContainer ?? 0;

  // Subtract scrollbar width when the scrollbar is visible.
  widthLeft = isScrollbarVisibleLeft
    ? Math.max(widthLeft - SCROLLBAR_WIDTH, 0)
    : widthLeft;
  widthRight = isScrollbarVisibleRight
    ? Math.max(widthRight - SCROLLBAR_WIDTH, 0)
    : widthRight;

  const maxPages = Math.max(leftPages.length, rightPages.length);

  const leftPagesAndImagesSameLength = leftPages.length === leftImages.length;
  const rightPagesAndImagesSameLength =
    rightPages.length === rightImages.length;

  const leftPagesReady = leftPagesAndImagesSameLength && widthLeft;
  const rightPagesReady = rightPagesAndImagesSameLength && widthRight;

  const currentLeftPage = useMemo(
    () => leftImages[currentLeftPageNumber - 1] ?? NullPDFiumImage,
    [currentLeftPageNumber, leftImages],
  );
  const currentRightPage = useMemo(
    () => rightImages[currentRightPageNumber - 1] ?? NullPDFiumImage,
    [currentRightPageNumber, rightImages],
  );

  /**
   * Bind cmd/ctrl+f to override the default search behavior
   */
  useHotkeys('cmd+f', (e) => {
    setIsSearching(true);
    e.preventDefault();
  });

  /**
   * Create search documents for the given pages
   */
  const richTextFuseSearcher = useMemo(
    () => new RightTextFuseSearcher(leftPages, rightPages),
    [leftPages, rightPages],
  );

  /**
   * Calculates the scale factors and zoom factors
   * between the dimensions of the current pdf page, the container dimensions and
   * desired zoomType
   */
  const leftScaleFactors = useMemo(() => {
    if (widthLeft && heightLeft) {
      return getScaleFactorsForImage(currentLeftPage, widthLeft, heightLeft);
    }

    // null version
    return {
      containerToCanvasWidth: 1,
      containerToCanvasWidthClamped: 1, // clamped to the native max width of the pdf
      containerToImageWidth: 1,
      containerToImageWidthClamped: 1, // clamped to the native max width of the pdf
      containerToCanvasHeight: 1,
    };
  }, [heightLeftContainer, leftImages, widthLeft]);

  const rightScaleFactors = useMemo(() => {
    if (widthRight && heightRight) {
      return getScaleFactorsForImage(currentRightPage, widthRight, heightRight);
    }

    // null version
    return {
      containerToCanvasWidth: 1,
      containerToCanvasWidthClamped: 1, // clamped to the native max width of the document
      containerToImageWidth: 1,
      containerToImageWidthClamped: 1, // clamped to the native max width of the document
      containerToCanvasHeight: 1,
    };
  }, [heightRightContainer, rightImages, widthRight]);

  const leftZoomFactor = useMemo(() => {
    switch (zoomType.value) {
      case 'width':
        return leftScaleFactors.containerToCanvasWidth;
      case 'auto':
        return leftScaleFactors.containerToCanvasWidthClamped;
      case 'page':
        return leftScaleFactors.containerToCanvasHeight;
      default:
        return parseFloat(zoomType.value);
    }
  }, [leftScaleFactors, zoomType]);

  const rightZoomFactor = useMemo(() => {
    switch (zoomType.value) {
      case 'width':
        return rightScaleFactors.containerToCanvasWidth;
      case 'auto':
        return rightScaleFactors.containerToCanvasWidthClamped;
      case 'page':
        return rightScaleFactors.containerToCanvasHeight;
      default:
        return parseFloat(zoomType.value);
    }
  }, [rightScaleFactors, zoomType]);

  /**
   * Configuration for the mini map and what to show.
   */
  const notSameFilter = useMemo(
    () => ({
      content: true,
      fontFamily: showFontFamilyChanges,
      fontSize: showFontSizeChanges,
      color: showColorChanges,
    }),
    [showFontFamilyChanges, showFontSizeChanges, showColorChanges],
  );

  /* Find the longest document, and get the view percentage */
  useEffect(() => {
    if (leftVirtualizedApi.current && rightVirtualizedApi.current) {
      const longestDocumentFound =
        leftVirtualizedApi.current.getScrollHeight() >
        rightVirtualizedApi.current.getScrollHeight()
          ? leftVirtualizedApi
          : rightVirtualizedApi;

      const leftViewPercentage =
        (heightLeftContainer ?? 0) /
        leftVirtualizedApi.current.getScrollHeight();
      const rightViewPercentage =
        (heightLeftContainer ?? 0) /
        rightVirtualizedApi.current.getScrollHeight();

      const viewPercentageCalculated =
        longestDocumentFound === leftVirtualizedApi
          ? leftViewPercentage
          : rightViewPercentage;

      setLongestDocument(longestDocumentFound);
      setViewPercentage(viewPercentageCalculated);
      setLeftViewPercentage(leftViewPercentage);
      setRightViewPercentage(rightViewPercentage);
    }
  }, [
    heightLeftContainer,
    heightRightContainer,
    widthRightContainer,
    widthLeftContainer,
    zoomType, // force a recalculation on zoomType change
  ]);

  /**
   * Spacing between each page, scaled to the relative size of the container in which the documents reside
   */
  const pageSpacingScaled = useMemo(() => {
    return PAGE_SPACING * leftScaleFactors.containerToImageWidthClamped;
  }, [leftScaleFactors.containerToImageWidthClamped]);

  /**
   * Offset to where the documents should try and auto align when clicking around.
   */
  const verticalAlignOffset = useMemo(() => {
    return (
      (heightLeftContainer ?? heightRightContainer ?? 0) *
      VERTICAL_ALIGN_OFFSET_PERCENTAGE
    );
  }, [heightLeftContainer, heightRightContainer]);

  // TODO: Move scale factor calc into createScrollMap....
  /**
   * Create a scroll map for the given pages
   */
  const scrollMap = useMemo(
    () =>
      createScrollMap(
        leftChunks,
        rightChunks,
        leftImages,
        rightImages,
        pageSpacingScaled,
      ),
    [leftChunks, leftImages, pageSpacingScaled, rightChunks, rightImages],
  );

  /**
   * Search handler
   */
  const search = useCallback(
    (text: string) => {
      setSearchText(text);
      const results = richTextFuseSearcher.search(text);
      setSearchResults(results);
    },
    [richTextFuseSearcher],
  );

  /**
   * Takes a new scrollTop, the delta, the side, and the scroll APIs
   * and maps the scroll percentages through the scrollMap to lock the
   * two panes where text is similar
   */
  const handleScrollMapping = useCallback(
    (
      scrollTop: number,
      side: DiffSide,
      emitterApi: SimpleVirtualizedListApi | null,
      receiverApi: SimpleVirtualizedListApi | null,
    ) => {
      if (emitterApi && receiverApi && isScrollLocked) {
        let scrollToForReciever = scrollTop;

        const scrollPercentageReceiver = getMappedPosition(
          scrollMap,
          side,
          emitterApi.getScrollTopPercentage(),
        );

        scrollToForReciever =
          scrollPercentageReceiver * receiverApi.getScrollHeight();

        receiverApi.scrollTo(
          {
            top: scrollToForReciever,
            behavior: 'instant',
          },
          true,
        );
      }

      setScrollPercentage(
        longestDocument.current?.getScrollTopPercentage() ?? 0,
      );
      setLeftScrollPercentage(
        leftVirtualizedApi.current?.getScrollTopPercentage() ?? 0,
      );
      setRightScrollPercentage(
        rightVirtualizedApi.current?.getScrollTopPercentage() ?? 0,
      );
    },
    [isScrollLocked, longestDocument, scrollMap],
  );

  /**
   * Scroll wheel handler for either left or right virtualized pane
   * Uses the scroll map to lock the two virtualized scroll panes together.
   */
  const handleWheel = useCallback(
    (
      deltaY: number,
      deltaX: number,
      side: DiffSide,
      emitterApi: SimpleVirtualizedListApi | null,
      receiverApi: SimpleVirtualizedListApi | null,
    ) => {
      if (emitterApi && receiverApi) {
        const existingScrollTop = emitterApi.getScrollTop();
        emitterApi.getScrollLeft();
        const scrollTop = emitterApi.addScrollDeltaY(deltaY);
        emitterApi.addScrollDeltaX(deltaX);

        const scrollTopUnchanged = existingScrollTop === scrollTop;

        //Don't map, just send the scroll delta to the otherside.
        if (scrollTopUnchanged && isScrollLocked) {
          receiverApi.scrollTo({
            top: receiverApi.getScrollTop() + deltaY,
            left: receiverApi.getScrollLeft() + deltaX,
          });
        } else {
          handleScrollMapping(scrollTop, side, emitterApi, receiverApi);

          if (isScrollLocked) {
            receiverApi.scrollTo({
              left: receiverApi.getScrollLeft() + deltaX,
            });
          }
        }
      }
    },
    [handleScrollMapping, isScrollLocked],
  );

  /**
   * Precalculate the height of a page based on the provided
   * width (which is the calculated width of the scroller's container)
   */
  const computeHeight = useCallback(
    (index: number, images: PDFiumImage[], scaleFactor: number) => {
      return images[index].canvasHeight * scaleFactor;
    },
    [],
  );

  /**
   * Trigger the scroll to part of the document
   * on a research result
   */
  useEffect(() => {
    const result = searchResults[searchIndex];
    if (result && result.item.side === 'left') {
      leftVirtualizedApi.current?.scrollToItem(result.item.pageNumber, {
        selector: '.rich-text-search-highlight',
      });
    } else if (result) {
      rightVirtualizedApi.current?.scrollToItem(result.item.pageNumber, {
        selector: '.rich-text-search-highlight',
      });
    }
  }, [leftVirtualizedApi, rightVirtualizedApi, searchIndex, searchResults]);

  /**
   * Allows the parent component to invoke a scroll to a specific chunk in our
   * rich text document diff.
   */
  useImperativeHandle(ref, () => {
    return {
      scrollToChunk: (id: number) => {
        if (!leftChunks || !rightChunks) {
          return;
        }

        const chunkLeft = leftChunks.find((c) => c.id === id);
        const chunkRight = rightChunks.find((c) => c.id === id);

        let chunkLeftScrollToPercentage;
        let chunkRightScrollToPercentage;

        let chunkLeftScrollTo;
        let chunkRightScrollTo;

        if (chunkLeft && leftImages) {
          chunkLeftScrollToPercentage = getChunkOffsetPercentage(
            chunkLeft,
            leftImages,
            pageSpacingScaled,
          );

          chunkLeftScrollTo =
            chunkLeftScrollToPercentage *
            (leftVirtualizedApi.current?.getScrollHeight() ?? 0);
        }

        if (chunkRight && rightImages) {
          chunkRightScrollToPercentage = getChunkOffsetPercentage(
            chunkRight,
            rightImages,
            pageSpacingScaled,
          );

          chunkRightScrollTo =
            chunkRightScrollToPercentage *
            (rightVirtualizedApi.current?.getScrollHeight() ?? 0);
        }

        // If they're equal / matching || move chunks, we line them up
        if (
          (chunkLeft?.type === 'equal' && chunkRight?.type === 'equal') ||
          chunkLeft?.type === 'move' ||
          chunkRight?.type === 'move'
        ) {
          if (chunkLeftScrollTo && leftVirtualizedApi.current) {
            leftVirtualizedApi.current.scrollTo(
              {
                top: chunkLeftScrollTo - verticalAlignOffset,
                behavior: 'smooth',
              },
              true,
            );
          }

          if (chunkRightScrollTo && rightVirtualizedApi.current) {
            rightVirtualizedApi.current.scrollTo(
              {
                top: chunkRightScrollTo - verticalAlignOffset,
                behavior: 'smooth',
              },
              true,
            );
          }
          // If they're not, we scroll to their respective locations on the scrollMap, but smoothly.
        } else {
          if (leftVirtualizedApi.current && chunkLeft) {
            chunkLeftScrollTo = chunkLeftScrollTo
              ? chunkLeftScrollTo
              : getMappedPosition(
                  scrollMap,
                  'right',
                  chunkRightScrollToPercentage ?? 0,
                ) * (leftVirtualizedApi.current?.getScrollHeight() ?? 0);
            leftVirtualizedApi.current.scrollTo({
              top: chunkLeftScrollTo - verticalAlignOffset,
              behavior: 'smooth',
            });
          }

          if (rightVirtualizedApi.current && chunkRight) {
            chunkRightScrollTo = chunkRightScrollTo
              ? chunkRightScrollTo
              : getMappedPosition(
                  scrollMap,
                  'left',
                  chunkLeftScrollToPercentage ?? 0,
                ) * (rightVirtualizedApi.current?.getScrollHeight() ?? 0);
            rightVirtualizedApi.current.scrollTo({
              top: chunkRightScrollTo - verticalAlignOffset,
              behavior: 'smooth',
            });
          }
        }
      },
    };
  });

  return (
    <div className={css.wrapper} ref={wrapperRef}>
      <div
        className={cx(
          css.container,
          zoomType.value !== 'auto' && css.zoomTypeOther,
        )}
        ref={containerRef}
      >
        <div className={css.viewer}>
          {isSearching && (
            <DiffSearch
              onSearchTextChange={search}
              onGotoResult={(result) => {
                setSearchIndex(searchResults.indexOf(result));
              }}
              onSearchClose={() => {
                setSearchIndex(0);
                setIsSearching(false);
                setSearchResults([]);
              }}
              searchText={searchText}
              searchResults={searchResults}
              searchIndex={searchIndex}
              debounce={maxPages ? (Math.min(maxPages, 1000) / 1000) * 1000 : 0}
            />
          )}
          <div className={css.pages}>
            <RichTextOutputPageHeader
              pageNumber={currentLeftPageNumber}
              isAtEnd={isLeftAtEnd}
              totalPages={leftPages.length}
              zoomTypeOption={zoomType}
              onPageChange={(pageNumber: number) =>
                leftVirtualizedApi.current?.scrollToItem(pageNumber - 1)
              }
              maxWidth={currentLeftPage.canvasWidth}
              onZoomChange={(zoomType) => setZoomType(zoomType)}
            />
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              ref={refLeft}
              className={css.page}
              onClick={() => setSelectedChunkId(-1)}
            >
              {leftPagesReady && (
                <SimpleVirtualizedList
                  className={css.virtualizedPane}
                  ref={leftVirtualizedApi}
                  items={leftPages}
                  centerItems={
                    currentLeftPage.canvasWidth * leftZoomFactor < widthLeft
                  }
                  passiveEventHandlers={false}
                  itemSpacing={pageSpacingScaled}
                  hideScrollbar={true}
                  onPageChange={(pageNumber, isScrollEnd) => {
                    setCurrentLeftPageNumber(pageNumber);
                    setIsLeftAtEnd(isScrollEnd);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    handleWheel(
                      e.deltaY,
                      e.deltaX,
                      'left',
                      leftVirtualizedApi.current,
                      rightVirtualizedApi.current,
                    );
                  }}
                  onScroll={(e, _deltaY, _deltaX, _isFocused) => {
                    handleScrollMapping(
                      e.currentTarget.scrollTop,
                      'left',
                      leftVirtualizedApi.current,
                      rightVirtualizedApi.current,
                    );

                    if (isScrollLocked) {
                      rightVirtualizedApi.current?.scrollTo(
                        {
                          left: leftVirtualizedApi.current?.getScrollLeft(),
                        },
                        true,
                      );
                    }
                  }}
                  itemOverScan={1}
                  computeHeight={({ index }) =>
                    computeHeight(index, leftImages, leftZoomFactor)
                  }
                >
                  {({ item, index, height, isScrolling, isFocused }) => (
                    <RichTextPageMemo
                      key={index}
                      side="left"
                      pageNumber={index}
                      chunks={item}
                      image={leftImages[index]}
                      height={height}
                      showFontFamilyChanges={showFontFamilyChanges}
                      showFontSizeChanges={showFontSizeChanges}
                      showColorChanges={showColorChanges}
                      hideTextLayer={(isResizing || !isFocused) && !isSearching}
                      deferTextLayer={isScrolling && !isSearching}
                      searchResults={searchResults}
                      highlightSearchResult={
                        searchResults[searchIndex]?.item?.side === 'left'
                          ? searchResults[searchIndex]
                          : undefined
                      }
                      selectedChunkId={selectedChunkId}
                      onChunkClick={onChunkClick}
                      hoveredChunkId={hoveredChunkId}
                      onChunkHover={onChunkHover}
                    />
                  )}
                </SimpleVirtualizedList>
              )}
            </div>
          </div>
          {!isScrollLocked && (
            <div
              className={cx(
                css.scrollbarContainer,
                css.scrollBarContainerCentered,
              )}
            >
              <RichTextMiniMapScroller
                chunkCollections={[leftChunks]}
                imageCollections={[leftImages]}
                pageSpacing={pageSpacingScaled}
                notSameFilter={notSameFilter}
                viewPercentage={leftViewPercentage}
                scrollTopPercentage={leftScrollPercentage}
                scrollMap={scrollMap}
                side="left"
                onScrollChange={(percentage) => {
                  if (leftVirtualizedApi.current) {
                    leftVirtualizedApi.current.scrollTo({
                      top:
                        leftVirtualizedApi.current.getScrollHeight() *
                        percentage,
                    });
                  }
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  handleWheel(
                    e.deltaY,
                    e.deltaX,
                    'left',
                    leftVirtualizedApi.current,
                    rightVirtualizedApi.current,
                  );
                }}
              />
            </div>
          )}

          <div className={css.pages}>
            <div className={css.pageHeader}>
              <RichTextOutputPageHeader
                pageNumber={currentRightPageNumber}
                isAtEnd={isRightAtEnd}
                totalPages={rightPages.length}
                zoomTypeOption={zoomType}
                onPageChange={(pageNumber: number) =>
                  rightVirtualizedApi.current?.scrollToItem(pageNumber - 1)
                }
                maxWidth={currentRightPage.canvasWidth}
                onZoomChange={setZoomType}
              />
            </div>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              ref={refRight}
              className={css.page}
              onClick={() => setSelectedChunkId(-1)}
            >
              {rightPagesReady && (
                <SimpleVirtualizedList
                  className={css.virtualizedPane}
                  ref={rightVirtualizedApi}
                  items={rightPages}
                  centerItems={
                    currentRightPage.canvasWidth * rightZoomFactor < widthRight
                  }
                  passiveEventHandlers={false}
                  itemSpacing={pageSpacingScaled}
                  hideScrollbar={true}
                  onPageChange={(pageNumber, isScrollEnd) => {
                    setCurrentRightPageNumber(pageNumber);
                    setIsRightAtEnd(isScrollEnd);
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    handleWheel(
                      e.deltaY,
                      e.deltaX,
                      'right',
                      rightVirtualizedApi.current,
                      leftVirtualizedApi.current,
                    );
                  }}
                  onScroll={(e, _deltaY, _deltaX, _isFocused) => {
                    handleScrollMapping(
                      e.currentTarget.scrollTop,
                      'right',
                      rightVirtualizedApi.current,
                      leftVirtualizedApi.current,
                    );

                    if (isScrollLocked) {
                      leftVirtualizedApi.current?.scrollTo(
                        {
                          left: rightVirtualizedApi.current?.getScrollLeft(),
                        },
                        true,
                      );
                    }
                  }}
                  itemOverScan={1}
                  computeHeight={({ index }) =>
                    computeHeight(index, rightImages, rightZoomFactor)
                  }
                >
                  {({ item, index, height, isScrolling, isFocused }) => (
                    <RichTextPageMemo
                      key={index}
                      side="right"
                      pageNumber={index}
                      chunks={item}
                      image={rightImages[index]}
                      height={height}
                      showFontFamilyChanges={showFontFamilyChanges}
                      showFontSizeChanges={showFontSizeChanges}
                      showColorChanges={showColorChanges}
                      hideTextLayer={(isResizing || !isFocused) && !isSearching}
                      deferTextLayer={isScrolling && !isSearching}
                      searchResults={searchResults}
                      highlightSearchResult={
                        searchResults[searchIndex]?.item?.side === 'right'
                          ? searchResults[searchIndex]
                          : undefined
                      }
                      selectedChunkId={selectedChunkId}
                      hoveredChunkId={hoveredChunkId}
                      onChunkClick={onChunkClick}
                      onChunkHover={onChunkHover}
                    />
                  )}
                </SimpleVirtualizedList>
              )}
            </div>
          </div>

          <div className={css.scrollbarContainer}>
            <div className={css.scrollBarContainerButton}>
              <IconButton
                svg={isScrollLocked ? LockedChainSvg : UnlockedChainSvg}
                aria-label="Lock scroll"
                onClick={() => setIsScrollLocked((state) => !state)}
                style="text"
                size="small"
                tone="base"
              />
            </div>

            <div className={css.scrollBarContainerMap}>
              {isScrollLocked ? (
                <RichTextMiniMapScroller
                  chunkCollections={[leftChunks, rightChunks]}
                  imageCollections={[leftImages, rightImages]}
                  pageSpacing={pageSpacingScaled}
                  notSameFilter={notSameFilter}
                  viewPercentage={viewPercentage}
                  scrollTopPercentage={scrollPercentage}
                  scrollMap={scrollMap}
                  onScrollChange={(percentage) => {
                    if (longestDocument.current) {
                      longestDocument.current.scrollTo({
                        top:
                          longestDocument.current.getScrollHeight() *
                          percentage,
                      });
                    }
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const emitterSide =
                      longestDocument.current === leftVirtualizedApi.current
                        ? 'left'
                        : 'right';
                    const shortestDocument =
                      longestDocument.current === leftVirtualizedApi.current
                        ? rightVirtualizedApi
                        : leftVirtualizedApi;

                    handleWheel(
                      e.deltaY,
                      e.deltaX,
                      emitterSide,
                      longestDocument.current,
                      shortestDocument.current,
                    );
                  }}
                />
              ) : (
                <RichTextMiniMapScroller
                  chunkCollections={[rightChunks]}
                  imageCollections={[rightImages]}
                  pageSpacing={pageSpacingScaled}
                  notSameFilter={notSameFilter}
                  viewPercentage={rightViewPercentage}
                  scrollTopPercentage={rightScrollPercentage}
                  scrollMap={scrollMap}
                  side="right"
                  onScrollChange={(percentage) => {
                    if (rightVirtualizedApi.current) {
                      rightVirtualizedApi.current.scrollTo({
                        top:
                          rightVirtualizedApi.current.getScrollHeight() *
                          percentage,
                      });
                    }
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    handleWheel(
                      e.deltaY,
                      e.deltaX,
                      'right',
                      rightVirtualizedApi.current,
                      leftVirtualizedApi.current,
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForwardedRichTextOutput = forwardRef(RichTextOutput);

export default ForwardedRichTextOutput;
