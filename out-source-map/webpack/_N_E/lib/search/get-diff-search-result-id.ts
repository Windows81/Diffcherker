import { type DiffSide } from 'types/diffSide';

const getDiffSearchResultId = (
  side: DiffSide,
  rowIndex: number,
  matchIndex: number,
): string => {
  return `${side}-r${rowIndex}-m${matchIndex}`;
};

export default getDiffSearchResultId;
