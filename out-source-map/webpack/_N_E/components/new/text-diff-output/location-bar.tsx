import cx from 'classnames';
import { Meta as Row, UnifiedRow, ChunkType } from 'types/normalize';
import { useCallback, useContext, useMemo } from 'react';

import css from './location-bar.module.css';
import React from 'react';
import { type DiffBlock } from 'types/normalize';
import TextDiffOutputContext from './context';

export interface LocationBarBlock {
  start: number;
  end: number;
  rowStartIndex: number;
  type: {
    left: ChunkType;
    right: ChunkType;
  };
}

type LocationBarProps = {
  diffBlocks: DiffBlock[];
  rows: Row[] | UnifiedRow[];
  allowMerging?: boolean;
};

const LocationBar: React.FC<LocationBarProps> = ({
  diffBlocks,
  rows,
  allowMerging,
}) => {
  const { selectedBlockIndex, api } = useContext(TextDiffOutputContext);

  const locationBarBlocks: LocationBarBlock[] = useMemo(
    () =>
      diffBlocks.map((block) => ({
        start: block.lineStart / rows.length,
        end: (block.lineEnd + 1) / rows.length,
        type: block.type,
        rowStartIndex: block.lineStart,
      })),
    [diffBlocks, rows.length],
  );

  const selectAndScrollToBlock = useCallback(
    (blockIndex: number) => {
      const block = diffBlocks[blockIndex];
      const isEqualBlock =
        block.type.left === 'equal' && block.type.right === 'equal';
      if (allowMerging && !isEqualBlock) {
        api.selectBlock(blockIndex);
      }
      api.scrollToBlock(blockIndex);
    },
    [allowMerging, api, diffBlocks],
  );

  return (
    <div className={css.container}>
      {locationBarBlocks.map(({ start, end, type }, blockIndex) => (
        <LocationBarSegmentMemo
          key={blockIndex}
          index={blockIndex}
          start={start}
          end={end}
          left={type.left}
          right={type.right}
          isSelected={blockIndex === selectedBlockIndex}
          onSelectLocation={selectAndScrollToBlock}
        />
      ))}
    </div>
  );
};

interface LocationBarSegmentProps {
  index: number;
  start: number;
  end: number;
  left: ChunkType;
  right: ChunkType;
  isSelected?: boolean;
  onSelectLocation: (index: number) => void;
}

const LocationBarSegment: React.FC<LocationBarSegmentProps> = ({
  index,
  start,
  end,
  left,
  right,
  isSelected,
  onSelectLocation,
}) => {
  return (
    <button
      className={cx(css.block, {
        [css.selected]: isSelected,
      })}
      onClick={() => onSelectLocation(index)}
      style={{
        top: `${start * 100}%`,
        bottom: `${(1 - end) * 100}%`,
      }}
    >
      <span className={css[left]} />
      <span className={css[right]} />
    </button>
  );
};

const LocationBarSegmentMemo = React.memo(
  LocationBarSegment,
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.left === nextProps.left &&
      prevProps.right === nextProps.right &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.start === nextProps.start &&
      prevProps.end === nextProps.end &&
      prevProps.onSelectLocation === nextProps.onSelectLocation
    );
  },
);

export default LocationBar;
