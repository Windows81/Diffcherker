import { MapSection, ScrollMap } from '.';
import stitchRangesTogether from './stitch-ranges-together';

export default function addSectionToScrollMap(
  scrollMap: ScrollMap,
  section: MapSection,
) {
  const lastSectionRange = scrollMap.sections[scrollMap.sections.length - 1];

  let addRangeToMap = true;

  if (lastSectionRange) {
    addRangeToMap = stitchRangesTogether(lastSectionRange, section, scrollMap);
  }

  if (addRangeToMap) {
    scrollMap.sections.push(section);
  }
}
