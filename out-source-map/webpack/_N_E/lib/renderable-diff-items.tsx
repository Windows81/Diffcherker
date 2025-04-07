import { DiffBlock, type Meta as Row, UnifiedRow } from 'types/normalize';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
export interface AbstractRenderableDiffItem<T = any, P = string> {
  data: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: P;
  index: number;
}

type BlockRenderableDiffItem = AbstractRenderableDiffItem<DiffBlock, 'block'>;
type RowRenderableDiffItem = AbstractRenderableDiffItem<
  Row | UnifiedRow,
  'row'
>;

export type RenderableDiffItem =
  | BlockRenderableDiffItem
  | RowRenderableDiffItem;

export type RenderableDiffItemsOption = {
  diffBlocks: DiffBlock[];
  rows: Row[] | UnifiedRow[];
  collapsible?: boolean;
  expandedBlocks?: DiffBlock[];
  forceAllDiffBlocks?: boolean;
};

/**
 * A special array that creates a set of `renderableItems` from blocks, rows, and
 * a set of configurations from a text-diff-result component, to feed into
 * Virtuoso and tracks a map between renderable items and rows/blocks so that
 * navigation/scrolling is possible.
 */
export default class RenderableDiffItems extends Array<RenderableDiffItem> {
  diffBlocks: DiffBlock[] = [];
  rows: Row[] | UnifiedRow[] = [];

  private _blockToItemMap: number[] = [];
  private _rowToItemMap: number[] = [];
  private _itemToBlockMap: number[] = [];
  private _leftLinetoRowMap: number[] = [];
  private _rightLineToRowMap: number[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  constructor(...args: RenderableDiffItem[]);
  constructor(option: RenderableDiffItemsOption);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    let items: RenderableDiffItem[] = args;
    const blockToItemMap: number[] = [];
    let itemToBlockMap: number[] = [];
    let rowToItemMap: number[] = [];
    const leftLineToRowMap: number[] = [];
    const rightLineToRowMap: number[] = [];

    if (args.length === 1 && typeof args[0] === 'object') {
      const options = args[0] as RenderableDiffItemsOption;

      const {
        diffBlocks,
        rows,
        collapsible = false,
        expandedBlocks = [],
        forceAllDiffBlocks = false,
      } = options;

      if (forceAllDiffBlocks) {
        items = diffBlocks.map((block, index) => ({
          data: block,
          type: 'block',
          index,
        }));
        itemToBlockMap = Array.from(diffBlocks.keys());
      } else {
        items = diffBlocks.reduce((acc, block, blockIndex) => {
          const areEqual =
            block.type.left === 'equal' && block.type.right === 'equal';
          const isInExpanded = expandedBlocks.includes(block);
          const expanded = areEqual && (isInExpanded || !collapsible);

          const blockRows: RenderableDiffItem[] = rows
            .slice(block.lineStart, block.lineEnd + 1)
            .map((row, index) => {
              // technically this is a side effect inside of a map which
              // is a code smell, but this is here for optimization purposes.
              if (row.left.line !== undefined) {
                leftLineToRowMap[row.left.line] = block.lineStart + index;
              }
              if (row.right.line !== undefined) {
                rightLineToRowMap[row.right.line] = block.lineStart + index;
              }
              return {
                data: row,
                type: 'row',
                index: block.lineStart + index,
              };
            });

          if (expanded) {
            blockToItemMap.push(acc.length);
            rowToItemMap = rowToItemMap.concat(
              blockRows.map((_br, i) => i + acc.length),
            );

            return acc.concat(blockRows);
          } else {
            blockToItemMap.push(acc.length);
            rowToItemMap = rowToItemMap.concat(blockRows.map(() => acc.length));

            acc.push({ data: block, type: 'block', index: blockIndex });

            return acc;
          }
        }, [] as RenderableDiffItem[]);
      }
    } else {
      items = args as RenderableDiffItem[];
    }

    super();

    /**
     * Splatting a huge array into the super function can cause a
     * "maximum call stack exceeded, looping avoids this"
     */
    for (let i = 0; i < items.length; i++) {
      this[i] = items[i];
    }

    this._blockToItemMap = blockToItemMap;
    this._rowToItemMap = rowToItemMap;
    this._itemToBlockMap = itemToBlockMap;
    this._leftLinetoRowMap = leftLineToRowMap;
    this._rightLineToRowMap = rightLineToRowMap;
  }

  get blockToItemMap() {
    return this._blockToItemMap;
  }

  get rowToItemMap() {
    return this._rowToItemMap;
  }

  get itemToBlockMap() {
    return this._itemToBlockMap;
  }

  get leftLineToRowMap() {
    return this._leftLinetoRowMap;
  }

  get rightLineToRowMap() {
    return this._rightLineToRowMap;
  }
}
