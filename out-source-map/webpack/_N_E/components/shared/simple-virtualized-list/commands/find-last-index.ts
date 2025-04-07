import { SimpleVirtualizedLayoutCache } from '..';

function isClippingFrameBottom(
  scrollBottom: number,
  item: SimpleVirtualizedLayoutCache,
  itemSpacing: number,
) {
  const top = item.top;
  const bottom = item.top + item.height + itemSpacing;

  return top <= scrollBottom && bottom >= scrollBottom;
}

export function findLastIndex(
  scrollBottom: number,
  scrollPercentage: number,
  positionHeightCache: SimpleVirtualizedLayoutCache[],
  itemSpacing: number,
) {
  let foundHeightCacheIndex;
  const estimatedIndex = Math.floor(
    positionHeightCache.length * scrollPercentage,
  );

  const positionHeightCacheProbe = positionHeightCache[estimatedIndex];

  if (!positionHeightCacheProbe) {
    return;
  }

  const bottom = positionHeightCacheProbe.top + positionHeightCacheProbe.height;

  const stepForward = (i: number) => (i + 1) % positionHeightCache.length;
  const stepBackward = (i: number) =>
    (i - 1 + positionHeightCache.length) % positionHeightCache.length;

  const stepper = bottom <= scrollBottom ? stepForward : stepBackward;

  let i = estimatedIndex;

  do {
    const cache = positionHeightCache[i];

    if (isClippingFrameBottom(scrollBottom, cache, itemSpacing)) {
      foundHeightCacheIndex = i + 1;
      break;
    }
    i = stepper(i);
  } while (i != estimatedIndex);

  return foundHeightCacheIndex;
}
