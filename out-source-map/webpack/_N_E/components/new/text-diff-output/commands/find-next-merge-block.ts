import { DiffBlock } from 'types/normalize';

export function findNextMergeBlock(
  blocks: DiffBlock[],
  selectedBlock?: DiffBlock,
) {
  const index = selectedBlock ? blocks.indexOf(selectedBlock) : -1;

  let foundMergeBlock;

  //+1 because we don't want to include our currently selected block in the search
  for (let i = index + 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type.left !== 'equal' || block.type.right !== 'equal') {
      foundMergeBlock = block;
      break;
    }
  }

  return foundMergeBlock;
}
