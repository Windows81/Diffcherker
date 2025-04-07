import cx from 'classnames';
import {
  CSSProperties,
  FC,
  ForwardedRef,
  ReactNode,
  RefObject,
  TouchEvent,
  UIEvent,
  WheelEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import useResizeObserver from 'use-resize-observer';
import { findFirstIndex } from './commands/find-first-index';
import { findLastIndex } from './commands/find-last-index';
import css from './index.module.css';
import { elInScrollFrame } from './queries/selector-in-view';

export const MAXIMUM_BROWSER_DIV_HEIGHT = 16777200;
const FRICTION: number = 0.95; // Controls how quickly the scrolling slows down with touch events
const MIN_VELOCITY: number = 0.1; // Minimum velocity threshold for stopping with touch events

export type ScrollToItemOptions = {
  selector?: string;
  offsetTop?: number;
  behavior?: 'instant' | 'smooth';
};

export type SimpleVirtualizedListItem<P> = {
  item: P;
  index: number;
  height: number;
  isScrolling?: boolean;
  isFocused?: boolean;
};
export type SimpleVirtualizedLayoutCache = {
  index: number;
  top: number;
  height: number;
  calcComplete: boolean;
  style?: CSSProperties;
};

export type SimpleVirtualizedListProps<P> = {
  items: P[];
  defaultItemHeight?: number;
  computeHeight?: (
    virtualizedItem: Omit<SimpleVirtualizedListItem<P>, 'height'>,
  ) => number;
  precomputeHeight?: boolean;
  centerItems?: boolean;
  itemOverScan?: number;
  className?: string;
  style?: CSSProperties;
  itemSpacing?: number;
  layoutBatchSize?: number;
  onScroll?: (
    scrollEvent: UIEvent<HTMLDivElement>,
    deltaY: number,
    deltaX: number,
    isFocused: boolean,
  ) => void;
  onPageChange?: (pageNumber: number, isScrollEnd: boolean) => void;
  onWheel?: (wheelEvent: WheelEvent<HTMLDivElement>) => void;
  scrollEndDebounce?: number;
  passiveEventHandlers?: boolean;
  hideScrollbar?: boolean;
  children: FC<SimpleVirtualizedListItem<P>>;
};

export type SimpleVirtualizedListApi = {
  scrollToItem: (index: number, options?: ScrollToItemOptions) => void;
  scrollTo: (options?: ScrollToOptions | undefined, silent?: boolean) => void;
  addScrollDeltaY: (deltaY: number) => number;
  addScrollDeltaX: (deltaX: number) => number;
  getItemPosition: (index: number) => void;
  getScrollTopPercentage: () => number;
  getScrollHeight: () => number;
  getScrollTop: () => number;
  getScrollLeft: () => number;
  getScrollTopMax: () => number;
  scrollFrameRef?: RefObject<HTMLDivElement>;
};

const SimpleVirtualizedList = <P,>(
  {
    items,
    defaultItemHeight = 20,
    computeHeight,
    onScroll,
    onPageChange,
    onWheel,
    centerItems = false,
    itemOverScan = 0,
    itemSpacing = 0,
    layoutBatchSize = 500,
    className,
    style,
    scrollEndDebounce = 650,
    passiveEventHandlers = true,
    hideScrollbar,
    children,
  }: SimpleVirtualizedListProps<P>,
  ref: ForwardedRef<SimpleVirtualizedListApi>,
) => {
  // Core calculation refs (they're refs so we can control re-renders)
  const totalHeightCache = useRef<number>(0);
  const frameWidthCache = useRef<number>(0);
  const frameHeightCache = useRef<number>(0);
  const scrollTop = useRef<number>(0);
  const scrollLeft = useRef<number>(0);

  //Dynamic calculation refs
  const dynamicallyLayingOut = useRef<boolean>(false);
  const layoutCount = useRef<number>(0);
  const layoutCacheKey = useRef<P[]>();
  const layoutBatchID = useRef<number>();
  const layoutCursor = useRef<number>(0);
  const layoutHoist = useRef<HTMLDivElement>(null);

  // State vars for touch to scroll propagation
  const lastTouchY = useRef<number>(0);
  const lastTouchX = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);
  const isTouching = useRef<boolean>(false);
  const isTouchMoving = useRef<boolean>(false);
  const velocityY = useRef<number>(0);
  const velocityX = useRef<number>(0);
  const momentumID = useRef<number | null>(null);

  // Holds the scroll frame div element, and the position/height cache for layout
  const scrollFrameRef = useRef<HTMLDivElement>(null);
  const skipNextScrollEvent = useRef<boolean>(false);
  const silenceOnScrollTo = useRef<boolean>(false);
  const layoutCache = useRef<SimpleVirtualizedLayoutCache[]>(
    new Array(items.length).fill({
      top: 0,
      height: defaultItemHeight,
      calcComplete: false,
    }),
  );
  const currentPage = useRef<number>(1);

  // Semaphores
  const heightIsComputed = useRef<boolean>(false);
  const isScrollEnd = useRef<boolean>(false);
  const isScrollingTimeoutId = useRef<NodeJS.Timeout>();
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const dynamicLayoutBatchSize = useRef<number>(layoutBatchSize);

  // Signal for a useEffect to observe and force a scroll to a given
  const [scrollToSelector, setScrollToSelector] = useState<string>();

  const [renderToStaticMarkupLoaded, setRenderToStaticMarkupLoaded] =
    useState<boolean>(false);
  const renderToStaticMarkup =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useRef<(element: ReactNode, options?: any) => string>();

  // If no `computeHeight` method is provided, this will kick off the
  // dynamic calculation of the items.
  const calculateHeightDynamically = !computeHeight;

  /**
   * The set of visible items
   */
  const [visibleItems, setVisibleItems] = useState<
    SimpleVirtualizedLayoutCache[]
  >([]);

  // Useful for some calculation
  const firstVisibleItemIndex = visibleItems[0]?.index ?? 0;
  const lastVisibleItemIndex =
    visibleItems[visibleItems.length - 1]?.index ?? 0;

  /**
   * Fetch and cache the render to static markup so that we don't have
   * to `await` every time we want to use it, slowing down the dynamic
   * render function.
   */
  useEffect(() => {
    const fetchReactDomServerStaticMarkup = async () => {
      const { renderToStaticMarkup: reactRenderToStaticMarkup } = await import(
        'react-dom/server'
      );

      renderToStaticMarkup.current = reactRenderToStaticMarkup;
      setRenderToStaticMarkupLoaded(true);
    };

    fetchReactDomServerStaticMarkup();
  }, []);

  /**
   * Default compute height function if none
   * is provided.
   */
  computeHeight = useMemo(() => {
    const defaultCompute = ({ index }: { index: number }) => {
      return layoutCache.current[index]?.height ?? defaultItemHeight;
    };

    return computeHeight ?? defaultCompute;
  }, [computeHeight, defaultItemHeight]);

  /**
   * Collect the width and height of the frame
   * to use calculate which items to set in setVisibleItems
   */
  useResizeObserver<HTMLDivElement>({
    ref: scrollFrameRef,
    onResize: ({ width, height }) => {
      frameWidthCache.current = width ?? 0;
      frameHeightCache.current = height ?? 0;

      calculateVisibleItems();
    },
  });

  /**
   * Refreshes all the `top` offsets
   * up to an optional `end` index
   */
  const refreshLayoutOffsets = useCallback(
    (end: number = items.length) => {
      let currTop = 0;
      const length = items.length;

      if (layoutCache.current) {
        for (let i = 0; i < Math.min(end, length); i++) {
          const cache = layoutCache.current[i];
          cache.top = currTop;
          cache.index = i;

          cache.style = {
            top: currTop,
            height: cache.height,
          } as CSSProperties;

          currTop += cache.height + itemSpacing;
        }
      }
    },
    [itemSpacing, items.length],
  );

  /**
   * Resets all the state vars and invalidates the dynamic
   * height cache
   */
  const resetDynamicLayoutCache = useCallback(() => {
    layoutCount.current = 0;
    dynamicallyLayingOut.current = false;
    layoutCacheKey.current = undefined;

    layoutCache.current.forEach((item) => {
      item.calcComplete = false;
    });
  }, []);

  /**
   * Workhorse method of the virtualization component.
   *
   * Calculates what items to place in the `visibleItems` array taking
   * the `layoutCache` and the `scrollPosition` into account.
   *
   * Also tracks what page/item the current list is focused on and
   * marks when the virtualized list is at the end of the scroll.
   */
  const calculateVisibleItems = useCallback(() => {
    if (!heightIsComputed.current || frameHeightCache.current === 0) {
      return;
    }

    const scrollPercentage =
      scrollTop.current /
      Math.min(totalHeightCache.current, MAXIMUM_BROWSER_DIV_HEIGHT);

    let firstIndex = findFirstIndex(
      scrollTop.current,
      scrollPercentage,
      layoutCache.current,
      itemSpacing,
    );

    let lastIndex = findLastIndex(
      scrollTop.current + frameHeightCache.current,
      scrollPercentage,
      layoutCache.current,
      itemSpacing,
    );

    // Shouldn't hit here, but edge cases be damned, if first or last index doesn't detect
    // any items clipping in and out of view, use the last one one.
    if (firstIndex === undefined || lastIndex === undefined) {
      firstIndex = firstVisibleItemIndex ?? 0;
      lastIndex = lastVisibleItemIndex ?? 0;
    }

    // Apply overscan and clamp
    const firstIndexClamped = Math.max(0, firstIndex - itemOverScan);
    const lastIndexClamped = Math.min(lastIndex + itemOverScan, items.length);

    const nextVisibleItems = layoutCache.current.slice(
      firstIndexClamped,
      lastIndexClamped,
    );

    // Moves the dynamic calculation cursor to where the user is currently trying to view.
    if (firstIndex) {
      layoutCursor.current = firstIndex;

      // Refresh the layout offsets of items up to the
      // cursor, so that future items beyond the cursor
      // calculate their offset correctly
      if (dynamicallyLayingOut.current) {
        refreshLayoutOffsets(layoutCursor.current);
      }
    }

    // Update the isScrollEnd state
    const prevIsScrollEnd = isScrollEnd.current;
    if (scrollFrameRef.current) {
      if (
        Math.ceil(scrollTop.current + scrollFrameRef.current.clientHeight) >=
        Math.floor(scrollFrameRef.current.scrollHeight)
      ) {
        isScrollEnd.current = true;
      } else {
        isScrollEnd.current = false;
      }
    }

    // TODO: This was a mistake, we shouldn't call anything in here a 'page'.
    // Should be `onItemChange', will deal with this later.
    // Page index at starts at 1
    const newPage = firstIndex + 1;
    if (
      currentPage.current !== newPage ||
      prevIsScrollEnd !== isScrollEnd.current
    ) {
      currentPage.current = newPage;
      onPageChange && onPageChange(currentPage.current, isScrollEnd.current);
    }

    setVisibleItems(nextVisibleItems);
  }, [
    itemSpacing,
    itemOverScan,
    items.length,
    firstVisibleItemIndex,
    lastVisibleItemIndex,
    refreshLayoutOffsets,
    onPageChange,
  ]);

  /**
   * STATIC CALCULATION OF THE LAYOUT CACHE
   * Statically generates the baseline cache. If a `computeHeight` method
   * is provided through the props, this creates the only source of
   * truth for how items get sized.
   */
  const runStaticLayout = useCallback(() => {
    let currTop = 0;

    layoutCache.current = items.map((item, index) => {
      const cache = {
        index,
        top: currTop,
        height: computeHeight({ item, index }),
        calcComplete: !calculateHeightDynamically,
        style: {
          height: computeHeight({ item, index }),
          top: currTop,
        } as CSSProperties,
      } as SimpleVirtualizedLayoutCache;

      currTop += cache.height + itemSpacing;
      return cache;
    });

    totalHeightCache.current = layoutCache.current.reduce(
      (sum, cache, index) =>
        sum + cache.height + (index === 0 ? 0 : itemSpacing),
      0,
    );
    heightIsComputed.current = true;

    calculateVisibleItems();
  }, [
    calculateHeightDynamically,
    calculateVisibleItems,
    computeHeight,
    itemSpacing,
    items,
  ]);

  /**
   * DYNAMIC CALCULATION OF THE LAYOUT CACHE
   * Dynamically measures each item inside a `layoutHoist` found
   * hidden in the dom.
   *
   * This runs a batch of measurements that can begin anywhere in the
   * cache array and iterates over it as if it were a circular buffer
   * until all measurements are made.
   *
   * The reason we don't measure the items in sequence is to support the ability
   * for the user to scroll to any part of list and have it render immediately
   * even if not all measurements are complete.
   */
  const runDynamicLayoutBatch = useCallback(() => {
    if (!layoutHoist.current || !renderToStaticMarkup.current) {
      return;
    }

    dynamicallyLayingOut.current = true;
    const from = layoutCursor.current ?? 0;

    // Check if 'from' index is within the bounds of the current items
    if (from >= items.length) {
      layoutCursor.current = 0;
    }

    let currTop = layoutCache.current[layoutCursor.current].top;
    let index = layoutCursor.current;
    let batchCount = 0;

    const start = performance.now();
    while (
      layoutCount.current < items.length &&
      batchCount < dynamicLayoutBatchSize.current
    ) {
      const cacheItem = layoutCache.current[index];
      const item = items[index];

      if (!cacheItem.calcComplete) {
        // Perform measurement
        layoutHoist.current.innerHTML = renderToStaticMarkup.current(
          children({
            index,
            item,
            isScrolling: false,
            isFocused: false,
            height: 0,
          }),
        );
        const height = layoutHoist.current.getBoundingClientRect().height;

        layoutCache.current[index].height = height;
        layoutCache.current[index].calcComplete = true;

        layoutCount.current++;
        batchCount++;
      }

      // Roll the current `top` value to zero if the loop rolls over to the first item.
      currTop = index === 0 ? 0 : currTop;

      // Set the top value and style the cache
      layoutCache.current[index].top = currTop;
      layoutCache.current[index].style = {
        height: layoutCache.current[index].height,
        top: currTop,
      } as CSSProperties;

      // Update the current top value and calculation cursor for the next iteration
      currTop += layoutCache.current[index].height + itemSpacing;
      layoutCursor.current = index;

      // Because the cursor can be moved outside of the batch context, we roll
      // back over the collection until we have successfully measured all items
      index = (index + 1) % items.length;
    }
    const end = performance.now();
    const executionTime = end - start;

    if (executionTime > 60) {
      dynamicLayoutBatchSize.current = dynamicLayoutBatchSize.current * 0.5;
    }

    // Update the total height
    totalHeightCache.current = layoutCache.current.reduce(
      (sum, cache, index) =>
        sum + cache.height + (index === 0 ? 0 : itemSpacing),
      0,
    );
    heightIsComputed.current = true;

    const fullLayoutComplete = layoutCount.current >= items.length;

    if (fullLayoutComplete) {
      layoutCursor.current = 0;
      layoutCount.current = 0;
      dynamicallyLayingOut.current = false;
      layoutCacheKey.current = items;

      // TODO, could optimize this out eventually.
      refreshLayoutOffsets();
    } else {
      // Request next batch of measurement calculations
      layoutBatchID.current = requestAnimationFrame(runDynamicLayoutBatch);
    }
  }, [items, layoutBatchSize, itemSpacing, children, refreshLayoutOffsets]);

  /**
   * Kicks off the default/static height & top item layout calculation anytime
   * any of the callback's dependencies are changed. Guard against a static
   * generation while the dynamic calculations are running.
   */
  useEffect(() => {
    if (dynamicallyLayingOut.current) {
      return;
    }

    runStaticLayout();
  }, [runStaticLayout]);

  /**
   * Every time the items change rebuild the static layout
   * and reset the dynamic layout cache variables
   */
  useEffect(() => {
    runStaticLayout();
    resetDynamicLayoutCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /**
   * Kicks off the dynamic height & top item calculation anytime
   * the items are updated. Manages the dynamic calculations through
   * batching the measurements inside a requestAnimationFrame
   */
  useEffect(() => {
    const calculationCacheBusted = layoutCacheKey.current != items;

    if (
      calculateHeightDynamically &&
      calculationCacheBusted &&
      renderToStaticMarkupLoaded
    ) {
      runDynamicLayoutBatch();
    }

    return () => {
      if (layoutBatchID.current) {
        cancelAnimationFrame(layoutBatchID.current);
      }
    };
  }, [
    items,
    calculateHeightDynamically,
    renderToStaticMarkupLoaded,
    resetDynamicLayoutCache,
    runDynamicLayoutBatch,
  ]);

  /**
   * We must manually track touch/starts/moves to simulate scrolling on
   * a div that has overflow:hidden; applied to it.
   */
  const handleTouchStart = useMemo(
    () => (event: TouchEvent) => {
      if (event.touches.length === 1) {
        lastTouchY.current = event.touches[0].clientY;
        lastTouchX.current = event.touches[0].clientX;

        isTouching.current = true;
        isTouchMoving.current = true;
      }
    },
    [],
  );

  /**
   * Handles touch moves for manual scrolling in an touchscreen context
   */
  const handleTouchMove = useMemo(
    () => (event: TouchEvent) => {
      if (!isTouching.current) {
        return;
      }

      // Calculate deltaY (similar to mouse wheel delta)
      const currentTouchY = event.touches[0].clientY;
      const currentTouchX = event.touches[0].clientX;
      const currentTime: number = Date.now();

      const deltaY = lastTouchY.current - currentTouchY;
      const deltaX = lastTouchX.current - currentTouchX;

      // Calculate velocity (distance over time)
      const deltaTime: number = currentTime - lastTouchTime.current;
      velocityY.current = deltaY / deltaTime;
      velocityX.current = deltaX / deltaTime;

      lastTouchY.current = currentTouchY;
      lastTouchX.current = currentTouchX;

      lastTouchTime.current = currentTime;

      if (scrollFrameRef.current) {
        scrollFrameRef.current.scrollTop += deltaY;
        scrollFrameRef.current.scrollLeft += deltaX;
      }

      event.preventDefault(); // Prevent default touch scroll
    },
    [],
  );

  /**
   * Manually applying scroll using touch events means also simulating the momentum
   */
  const applyMomentum = useMemo(
    () => () => {
      if (
        Math.abs(velocityY.current) < MIN_VELOCITY &&
        Math.abs(velocityX.current) < MIN_VELOCITY
      ) {
        isTouchMoving.current = false;
        return;
      }

      // Reduce the velocity by some friction coefficient
      velocityY.current *= FRICTION;
      velocityX.current *= FRICTION;

      if (scrollFrameRef.current) {
        //16ms is a assuming a target of 60fps...
        //I guess we could manually calculate this between frames? But this was recommended, and
        //seems to work
        scrollFrameRef.current.scrollTop += velocityY.current * 16;
        scrollFrameRef.current.scrollLeft += velocityX.current * 16;
      }

      momentumID.current = requestAnimationFrame(applyMomentum);
    },
    [],
  );

  /**
   * Starts the momentum recursion loop when the
   * user stops the touch
   */
  const handleTouchEnd = useMemo(
    () => (_event: TouchEvent<HTMLDivElement>) => {
      isTouching.current = false;
      applyMomentum();
    },
    [applyMomentum],
  );

  /**
   * Cast a regular Event as a WheelEvent since we're
   * bubbling the onWheel event while manually wiring it
   * ourselves.
   */
  const handleWheel = useMemo(
    () => (e: Event) => {
      onWheel && onWheel(e as unknown as WheelEvent<HTMLDivElement>);
    },
    [onWheel],
  );

  /**
   * Track isScrolling as a state variable, so we can expose it
   * to the pages
   */
  const handleScroll = useMemo(
    () => (e: Event) => {
      const event = e as unknown as UIEvent<HTMLDivElement>;

      if (event) {
        setIsScrolling(true);

        // need some work here to support deltaX
        const newScrollTop = event.currentTarget.scrollTop;
        const newScrollLeft = event.currentTarget.scrollLeft;

        const deltaY = newScrollTop - scrollTop.current;
        const deltaX = newScrollLeft - scrollLeft.current;

        scrollTop.current = newScrollTop;
        scrollLeft.current = newScrollLeft;

        clearTimeout(isScrollingTimeoutId.current);
        isScrollingTimeoutId.current = setTimeout(() => {
          setIsScrolling(false);
        }, scrollEndDebounce);

        calculateVisibleItems();

        if (skipNextScrollEvent.current) {
          skipNextScrollEvent.current = false;
          return;
        }

        if (silenceOnScrollTo.current) {
          return;
        }

        onScroll && onScroll(event, deltaY, deltaX, isFocused);
      }
    },
    [scrollEndDebounce, calculateVisibleItems, onScroll, isFocused],
  );

  /**
   * Manually wire up the wheel and scroll event so we can
   * wire up the event handler as 'passive: false' if we want to
   * allowing us to interrupt the scroll event with
   * event.stopPropagation
   */
  useEffect(() => {
    let div: HTMLDivElement;
    if (scrollFrameRef.current) {
      scrollFrameRef.current.addEventListener('wheel', handleWheel, {
        passive: passiveEventHandlers,
      });
      scrollFrameRef.current.addEventListener('scroll', handleScroll, {
        passive: passiveEventHandlers,
      });

      div = scrollFrameRef.current;
    }

    return () => {
      div.removeEventListener('wheel', handleWheel);
      div.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, handleWheel, passiveEventHandlers]);

  /**
   * If any touchstart events propagate to the window,
   * on this scrolling context or another, just cancel the momentum scrolling.
   */
  useEffect(() => {
    const onWindowTouchStart = () => {
      if (momentumID.current) {
        cancelAnimationFrame(momentumID.current);
        momentumID.current = null;
      }
    };

    window.addEventListener('touchstart', onWindowTouchStart);
    return () => {
      window.removeEventListener('touchstart', onWindowTouchStart);
    };
  }, []);

  /**
   * Cached styles for the simple virtualized list elements
   */
  const scrollSpacerStyle = useMemo<CSSProperties>(
    () => ({
      height: totalHeightCache.current,
      position: 'relative',
    }),
    //TODO: Gotta rethink this... maybe just a state variable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalHeightCache.current],
  );

  const scrollFrameStyle = useMemo<CSSProperties>(
    () => ({ height: '100%', minWidth: '100%', ...style }),
    [style],
  );

  /**
   * Expose the simple virtualized list API
   */
  useImperativeHandle(ref, () => {
    return {
      getItemPosition(index: number) {
        const item = layoutCache.current[index];
        return item.top;
      },

      scrollToItem(index, options = {}) {
        const { offsetTop = 0, behavior = 'instant', selector } = options;
        const item = layoutCache.current[index];

        // We say the list is focused, if we're scrolling to an item
        // Important for scroll lock functionality by users
        setIsFocused(true);

        if (scrollFrameRef.current) {
          scrollFrameRef.current.scrollTo({
            top: Math.ceil(item.top - offsetTop),
            behavior,
          });
        }

        if (selector) {
          setScrollToSelector(selector);
        }
      },

      scrollTo(options?: ScrollToOptions | undefined, silent = false) {
        silenceOnScrollTo.current = false;
        skipNextScrollEvent.current = false;

        if (scrollFrameRef.current) {
          if (silent) {
            skipNextScrollEvent.current = true;
            silenceOnScrollTo.current = true;
            scrollFrameRef.current.addEventListener(
              'scrollend',
              () => {
                silenceOnScrollTo.current = false;
              },
              { once: true },
            );
          }

          scrollFrameRef.current.scrollTo(options);
        }
      },

      addScrollDeltaY(deltaY: number) {
        if (scrollFrameRef.current) {
          scrollFrameRef.current.scrollTop += deltaY;
          return scrollFrameRef.current.scrollTop;
        }
        return 0;
      },

      addScrollDeltaX(deltaX: number) {
        if (scrollFrameRef.current) {
          scrollFrameRef.current.scrollLeft += deltaX;
          return scrollFrameRef.current.scrollLeft;
        }
        return 0;
      },

      getScrollTopPercentage() {
        if (scrollFrameRef.current) {
          return scrollFrameRef.current.scrollTop / totalHeightCache.current;
        }
        return 0;
      },

      getScrollHeight() {
        return totalHeightCache.current;
      },

      getScrollTop() {
        return scrollFrameRef?.current?.scrollTop ?? 0;
      },

      getScrollLeft() {
        return scrollFrameRef?.current?.scrollLeft ?? 0;
      },

      getScrollTopMax() {
        if (scrollFrameRef.current) {
          return (
            scrollFrameRef.current.scrollHeight -
            scrollFrameRef.current.clientHeight
          );
        }
        return 0;
      },

      get scrollFrameRef() {
        return scrollFrameRef;
      },
    };
  }, []);

  /**
   * Allows the page to render in it's new location before
   * finishing off the scroll in the right location
   * using the provided selector.
   */
  useLayoutEffect(() => {
    if (scrollToSelector && scrollFrameRef.current) {
      const el = scrollFrameRef.current.querySelector(scrollToSelector);

      if (el && !elInScrollFrame(el, scrollFrameRef.current)) {
        const top =
          el.getBoundingClientRect().top -
          scrollFrameRef.current.getBoundingClientRect().top +
          scrollFrameRef.current.scrollTop;
        scrollFrameRef.current.scrollTo({ top });
      }
    }
    setScrollToSelector(undefined);
  }, [scrollToSelector]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={cx(
        css.scroller,
        hideScrollbar && css.hideScrollbar,
        className,
      )}
      ref={scrollFrameRef}
      style={scrollFrameStyle}
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      onMouseOver={() => {
        setIsFocused(true);
      }}
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      onMouseOut={() => {
        setIsFocused(false);
      }}
      onClick={() => {
        setIsFocused(true);
      }}
      onKeyDown={() => {
        setIsFocused(true);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div className={cx(css.item, css.layoutHoist)}>
        <div ref={layoutHoist} />
      </div>

      <div
        className={cx(css.spacer, centerItems && css.centerItems)}
        style={scrollSpacerStyle}
      >
        {visibleItems.map((cache) => {
          if (!items[cache.index]) {
            return null;
          }
          return (
            <div key={cache.index} className={css.item} style={cache.style}>
              {children({
                index: cache.index,
                item: items[cache.index],
                isScrolling,
                isFocused,
                height: cache.height,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ForwardedSimpleVirtualizedList = forwardRef(SimpleVirtualizedList) as <P>(
  props: SimpleVirtualizedListProps<P> & {
    ref?: ForwardedRef<SimpleVirtualizedListApi>;
  },
) => ReturnType<typeof SimpleVirtualizedList>;

export default ForwardedSimpleVirtualizedList;
