import { SimpleVirtualizedLayoutCache } from '..';
function isClippingFrameTop(
  scrollTop: number,
  item: SimpleVirtualizedLayoutCache,
  itemSpacing: number,
) {
  const top = item.top;
  const bottom = item.top + item.height + itemSpacing;

  return Math.floor(top) <= Math.ceil(scrollTop) && bottom >= scrollTop;
}

export function findFirstIndex(
  scrollTop: number,
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

  const top = positionHeightCacheProbe.top;

  const stepForward = (i: number) => (i + 1) % positionHeightCache.length;
  const stepBackward = (i: number) =>
    (i - 1 + positionHeightCache.length) % positionHeightCache.length;

  const stepper = top <= scrollTop ? stepForward : stepBackward;

  let i = estimatedIndex;
  do {
    const cache = positionHeightCache[i];

    if (isClippingFrameTop(scrollTop, cache, itemSpacing)) {
      foundHeightCacheIndex = i;
      break;
    }
    i = stepper(i);
  } while (i != estimatedIndex);

  return foundHeightCacheIndex;
}
