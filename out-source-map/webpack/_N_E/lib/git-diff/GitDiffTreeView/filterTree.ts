import { GitDiffTreeSliceProps } from './GitDiffTreeSlice';

export const filterTree = (
  search: string,
  value: GitDiffTreeSliceProps['tree'],
) => {
  const out: GitDiffTreeSliceProps['tree'] = [];
  for (const child of value) {
    if (!child.tree) {
      if (child.label!.toLowerCase().includes(search.toLowerCase())) {
        out.push(child);
      }
    } else {
      const tree = filterTree(search, child.tree);
      if (tree.length > 0) {
        out.push({
          ...child,
          tree,
        });
      }
    }
  }
  return out;
};
