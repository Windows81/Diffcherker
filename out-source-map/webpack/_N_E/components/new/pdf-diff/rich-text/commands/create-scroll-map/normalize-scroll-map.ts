import { ScrollMap } from '.';

export default function normalizeScrollMap(scrollMap: ScrollMap): ScrollMap {
  if (!scrollMap.sections.length) {
    return scrollMap;
  }

  const [lastLeft, lastRight] =
    scrollMap.sections[scrollMap.sections.length - 1].ranges;

  const leftHeight = lastLeft[1];
  const rightHeight = lastRight[1];

  scrollMap.sections.forEach((section) => {
    const [leftRange, rightRange] = section.ranges;
    leftRange[0] = leftRange[0] / leftHeight;
    leftRange[1] = leftRange[1] / leftHeight;
    rightRange[0] = rightRange[0] / rightHeight;
    rightRange[1] = rightRange[1] / rightHeight;
  });

  return scrollMap;
}
