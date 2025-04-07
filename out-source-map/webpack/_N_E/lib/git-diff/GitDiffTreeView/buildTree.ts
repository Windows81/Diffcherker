import { FileEntry } from '../types';
import { GitDiffTreeSliceProps } from './GitDiffTreeSlice';

export const buildTree = (files: FileEntry[]) => {
  // TODO(@izaakschroeder): Fix `any` type here.
  // eslint-disable-next-line
  const index: Record<string, any> = {};
  const ensure = (
    file: FileEntry,
    [name, ...rest]: string[],
    store: typeof index,
  ) => {
    store[name] ??= { label: name };
    if (rest.length > 0) {
      ensure(file, rest, (store[name].tree ??= {}));
    } else {
      store[name].file = file;
    }
  };
  const map = (store: typeof index): GitDiffTreeSliceProps['tree'] => {
    const values = Object.values(store);
    for (const value of values) {
      if (value.tree) {
        value.tree = map(value.tree);
      }
    }
    return values;
  };
  for (const file of files) {
    ensure(
      file,
      file.newName ? file.newName.split('/') : file.name.split('/'),
      index,
    );
  }
  return map(index);
};
