import { MapSection } from '.';

export default function isSectionEmpty(section: MapSection) {
  const [leftRange, rightRange] = section.ranges;
  return leftRange[0] === leftRange[1] && rightRange[0] === rightRange[1];
}
