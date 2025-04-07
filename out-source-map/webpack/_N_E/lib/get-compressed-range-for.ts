import { DiffBlock } from 'types/normalize';

export type CompressedRange = {
  rangeStart: number;
  rangeEnd: number;
};

export type CompressedRangeOptions = {
  collapseLinesPadding: number;
  collapseLinesThreshold: number;
  collapseLinesThresholdEnds: number;
};

const DEFAULT_COMPRESSED_RANGE_OPTIONS: CompressedRangeOptions = {
  collapseLinesPadding: 20,
  collapseLinesThreshold: 60,
  collapseLinesThresholdEnds: 80,
};

const getCompressedRangeFor = (
  index: number,
  diffBlocks: DiffBlock[],
  options: CompressedRangeOptions = DEFAULT_COMPRESSED_RANGE_OPTIONS,
): CompressedRange | undefined => {
  const block = diffBlocks[index];
  const blockRowCount = block.lineEnd - block.lineStart;

  const lineCount = block.lineEnd - block.lineStart;
  const isFirstBlock = index === 0;
  const isLastBlock = index + 1 === diffBlocks.length;
  const collapseLinesThreshold =
    isFirstBlock || isLastBlock
      ? options.collapseLinesThresholdEnds
      : options.collapseLinesThreshold;
  const collapseLinesPadding = options.collapseLinesPadding;

  if (lineCount > collapseLinesThreshold) {
    return {
      rangeStart: isFirstBlock ? 0 : collapseLinesPadding,
      rangeEnd: blockRowCount - 1 - (isLastBlock ? 0 : collapseLinesPadding),
    };
  }
};

export default getCompressedRangeFor;
