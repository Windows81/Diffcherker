import { DiffBlock } from 'types/normalize';
import { Diff } from 'types/diff';
import addDiffText from './add-diff-text';
import deleteDiffText from './delete-diff-text';
import modifyDiffText from './modify-diff-text';
import Tracking from 'lib/tracking';

export type MergeDirection = 'rtl' | 'ltr';

export default function merge(
  diff: Diff,
  toMerge: DiffBlock,
  direction: MergeDirection,
) {
  const diffBlocks = diff.blocks ?? [];
  const start = toMerge.lineStart;
  const end = toMerge.lineEnd;
  const originalRows = diff.rows ?? [];

  const toReplace = direction === 'rtl' ? 'left' : 'right';
  const toCopy = direction === 'rtl' ? 'right' : 'left';
  // the below check is due to how the diffing interprets a linebreak that coincides with text on the other side
  // (insideChanged === true && one side being empty && row above inside not changed) signals that there is a linebreak
  // we use modifyDiffText rather than addDiffText/deleteDiffText if there is a linebreak
  const areThereLinebreaks =
    originalRows[start].insideChanged &&
    (originalRows[start - 1] === undefined ||
      !originalRows[start - 1].insideChanged);
  const deletingLines =
    originalRows[start][toCopy].chunks.length === 0 && !areThereLinebreaks;
  const insertingLines =
    originalRows[start][toReplace].chunks.length === 0 && !areThereLinebreaks;
  let updatedSection;
  let operationType;
  if (deletingLines) {
    operationType = 'deleting lines';
    updatedSection = deleteDiffText(
      diff,
      diffBlocks,
      start,
      end,
      originalRows,
      toReplace,
    );
  } else if (insertingLines) {
    operationType = 'inserting lines';
    updatedSection = addDiffText(
      diff,
      diffBlocks,
      start,
      end,
      originalRows,
      toReplace,
    );
  } else {
    operationType = 'modifying lines';
    updatedSection = modifyDiffText(
      diff,
      diffBlocks,
      start,
      end,
      originalRows,
      toReplace,
    );
  }

  Tracking.trackEvent('Merged section', {
    direction,
    type: operationType,
  });

  return {
    [toCopy]: diff[toCopy],
    [toReplace]: updatedSection,
    localTime: '',
  };
}
