import { FileEntry } from './types';

type GitDiffStatus = 'edit' | 'add' | 'remove' | 'rename' | 'no-change';

export const getGitDiffStatus = (file: FileEntry): GitDiffStatus | null => {
  // TODO handle "no change" status

  if (file.newName) {
    return 'rename';
  }

  if (file.oldHex && file.newHex && file.oldHex === file.newHex) {
    return 'no-change';
  }

  if (file.oldHex && file.newHex) {
    return 'edit';
  }

  if (file.newHex) {
    return 'add';
  }

  if (file.oldHex) {
    return 'remove';
  }

  return null;
};
