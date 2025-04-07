import { type DiffSide } from 'types/diffSide';

const getChunkSearchId = (
  side: DiffSide,
  rowIndex: number,
  chunkIndex: number,
): string => {
  return `${side}-r${rowIndex}-c${chunkIndex}`;
};

export default getChunkSearchId;
