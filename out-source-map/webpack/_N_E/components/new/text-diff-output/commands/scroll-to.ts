import { type VirtuosoHandle } from 'react-virtuoso';
import type RenderableDiffItems from 'lib/renderable-diff-items';
import { DiffSide } from 'types/diffSide';

const TEXT_DIFF_LINE_ID_PREFIX = 'text-diff-line-';

export const getDiffLineId = (index: number, parentId?: string) =>
  `${parentId ? parentId + '-' : ''}${TEXT_DIFF_LINE_ID_PREFIX}${index}`;

export const scrollToBlock = (
  index: number | undefined,
  virtuoso: React.MutableRefObject<VirtuosoHandle | null>,
  renderableItems: RenderableDiffItems,
  offset?: number,
) => {
  if (index === undefined) {
    return;
  }

  const renderItemIndex = renderableItems?.blockToItemMap
    ? renderableItems.blockToItemMap[index]
    : index;

  virtuoso.current?.scrollToIndex({
    index: renderItemIndex,
    offset: (offset ?? 0) * -1,
    align: 'start',
  });
  return;
};

export const scrollToRow = (
  index: number | undefined,
  virtuoso: React.MutableRefObject<VirtuosoHandle | null>,
  renderableItems: RenderableDiffItems,
  parentId: string,
  offset?: number,
) => {
  if (index === undefined) {
    return;
  }

  const renderItemIndex = renderableItems?.rowToItemMap
    ? renderableItems.rowToItemMap[index]
    : index;

  virtuoso.current?.scrollToIndex({
    index: renderItemIndex,
    offset: (offset ?? 0) * -1,
    align: 'start',
  });

  setTimeout(() => {
    let el: Element | null = null;
    let additionalOffset = 0;
    const blockIsActive = document
      // see diff-block.tsx for what element this querySelector targets.
      .querySelector('.diff-selected-block')
      ?.querySelector(`#${getDiffLineId(index, parentId)}`);
    el = document.body.querySelector(`#${getDiffLineId(index, parentId)}`);
    if (blockIsActive) {
      // when you scroll to a block that has the merge context open,
      // the row you scroll to ends up being underneath the navigation control box.
      // so we need to scroll a bit more to make sure the row is visible.
      additionalOffset = 54; // better offset than 51 (top change bar height) because this shows the borders
    }

    /**
     * We do a final scroll action incase the row is inside a
     * diffBlock virtuoso element and not it's own virtuoso element.
     */
    if (el) {
      const top =
        el.getBoundingClientRect().top +
        document.documentElement.scrollTop -
        (offset ?? 0) -
        additionalOffset;

      window.scrollTo({ top });
    }
  }, 0);
};

export const scrollToLine = (
  index: number | undefined,
  side: DiffSide,
  virtuoso: React.MutableRefObject<VirtuosoHandle | null>,
  renderableItems: RenderableDiffItems,
  parentId: string,
  offset?: number,
) => {
  if (index === undefined) {
    return;
  }

  const renderableItemMap =
    side === 'left'
      ? renderableItems?.leftLineToRowMap
      : renderableItems?.rightLineToRowMap;

  const renderItemIndex = renderableItemMap ? renderableItemMap[index] : index;

  scrollToRow(renderItemIndex, virtuoso, renderableItems, parentId, offset);
};
