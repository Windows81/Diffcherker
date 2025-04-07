import { SectionRange } from '.';

export default function clampAndExtend(
  newSideRange: SectionRange,
  prevSideRange: SectionRange,
) {
  if (newSideRange[0] < prevSideRange[1]) {
    newSideRange[0] = prevSideRange[1];

    if (newSideRange[1] < newSideRange[0]) {
      newSideRange[0] = newSideRange[1];
    }
    // if they are empty - do not add
    // ensure the values are continuous across
  } else if (newSideRange[0] > prevSideRange[1]) {
    newSideRange[0] = prevSideRange[1];
  }
}
