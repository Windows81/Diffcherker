import { type UnifiedRow, type Meta as Row } from 'types/normalize';
import { FC } from 'react';
import { CommentLocation } from 'types/comment';
import { Diff } from 'types/diff';
import { DiffInputType } from 'types/diff-input-type';
import type { TextDiffOutputCommonProps } from '../text-diff-output';
import { HighlightChunks } from './commands/process-highlight-chunk';
import DiffBlock from './diff-block';
import DiffRow from './diff-row';
import { DiffBlock as DiffBlockInterface } from 'types/normalize';
import { RowMoveType } from 'types/moves';

type TextDiffOutputItemCommonProps = {
  parentId: string;
  index: number;
  lineNumberWidth?: number;
};

type TextDiffOutputItemProps = TextDiffOutputItemCommonProps &
  TextDiffOutputCommonProps & {
    diff: Diff;
    type: 'row' | 'block';
    onExpandDiffblock?: (block: DiffBlockInterface) => void;
    expandedDiffBlocks?: DiffBlockInterface[];
    highlightChunks?: HighlightChunks;
    typeData: Row | UnifiedRow | DiffBlockInterface;
    currSearchResultId: string;
    diffInputType: DiffInputType;
    shouldCollapseLines?: boolean;
    isUnified?: boolean;
    syntaxHighlight?: string;
    isUserSearching?: boolean;
    openCommentLocations?: CommentLocation[];
    moveStates?: {
      left: RowMoveType[];
      right: RowMoveType[];
    };
  };

const TextDiffOuputItem: FC<TextDiffOutputItemProps> = ({
  diff,
  type,
  onExpandDiffblock,
  expandedDiffBlocks = [],
  typeData,
  shouldCollapseLines,
  moveStates,
  ...commonProps
}) => {
  if (type === 'row') {
    return (
      <DiffRow
        key={commonProps.index}
        row={typeData as Row | UnifiedRow}
        isSelected={false}
        moves={diff.moves}
        {...commonProps}
      />
    );
  } else {
    return (
      <DiffBlock
        key={commonProps.index}
        diff={diff}
        block={typeData as DiffBlockInterface}
        isExpanded={expandedDiffBlocks.includes(typeData as DiffBlockInterface)}
        onExpandDiffblock={onExpandDiffblock}
        shouldCollapseLines={shouldCollapseLines}
        moveStates={moveStates}
        {...commonProps}
      />
    );
  }
};

export default TextDiffOuputItem;
