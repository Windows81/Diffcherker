import { ScrollMap, SectionRange } from '.';

export default function cullAndExtend(
  newSideRange: SectionRange,
  prevSideRange: SectionRange,
  scrollMap: ScrollMap,
) {
  if (newSideRange[0] < prevSideRange[1]) {
    // Ensure no overlap
    for (let i = scrollMap.sections.length - 1; i >= 0; i--) {
      const currSection = scrollMap.sections[i];
      const [currSideRange, _] = currSection.ranges;

      if (newSideRange[0] < currSideRange[1] && currSection.type === 'solo') {
        currSideRange[1] = newSideRange[0];
      } else {
        break;
      }

      if (currSideRange[1] <= currSideRange[0]) {
        currSideRange[0] = currSideRange[1];
      }
    }
    // ensure the values are continuous across
  } else if (newSideRange[0] > prevSideRange[1]) {
    prevSideRange[1] = newSideRange[0];
  }
}
