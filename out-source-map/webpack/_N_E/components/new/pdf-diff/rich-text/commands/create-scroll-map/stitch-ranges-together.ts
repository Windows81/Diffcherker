import { MapSection, ScrollMap } from '.';
import clampAndExtend from './clamp-and-extend';
import cullAndExtend from './cull-and-extend';
import isSectionEmpty from './is-section-empty';

export default function stitchRangesTogether(
  prevSection: MapSection,
  newSection: MapSection,
  scrollMap: ScrollMap,
) {
  const [prevLeftRange, prevRightRange] = prevSection.ranges;
  const [newLeftRange, newRightRange] = newSection.ranges;

  if (newSection.type === 'matched' && prevSection.type === 'solo') {
    cullAndExtend(newLeftRange, prevLeftRange, scrollMap);
    cullAndExtend(newRightRange, prevRightRange, scrollMap);
  } else if (newSection.type === 'solo' && prevSection.type === 'matched') {
    clampAndExtend(newLeftRange, prevLeftRange);
    clampAndExtend(newRightRange, prevRightRange);

    //Todo: important to leave all solo matched ranges, otherwise they can get clamped out of existing
    return true;
  }

  if (isSectionEmpty(prevSection)) {
    scrollMap.sections.pop();
    if (scrollMap.sections.length > 0) {
      prevSection = scrollMap.sections[scrollMap.sections.length - 1];
      return stitchRangesTogether(prevSection, newSection, scrollMap);
    }
  }
  if (isSectionEmpty(newSection)) {
    return false;
  }

  if (newSection.type === prevSection.type) {
    //extend the range of the last one if they end of the same page
    if (
      newSection.pageEndLeft === prevSection.pageEndLeft &&
      newSection.pageEndRight === newSection.pageEndLeft
    ) {
      prevLeftRange[1] = newLeftRange[1];
      prevRightRange[1] = newRightRange[1];

      prevSection.pageEndLeft = newSection.pageEndLeft;
      prevSection.pageEndRight = newSection.pageEndRight;
      return false;
    } else {
      //if they end on separate pages, keep them separate segments
      newLeftRange[0] = prevLeftRange[1];
      newRightRange[0] = prevRightRange[1];

      return true;
    }
  }

  return true;
}
