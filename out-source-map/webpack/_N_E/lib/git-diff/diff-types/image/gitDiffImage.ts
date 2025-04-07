import { GitDiffFileData, GitDiffMeta } from 'lib/git-diff/types';

export interface GitDiffImageSide {
  data: Uint8Array;
  type: string;
}

export interface GitDiffImageResult {
  left: GitDiffImageSide | null;
  right: GitDiffImageSide | null;
}

export const gitDiffImage = async (
  _name: string,
  [left, right]: GitDiffFileData,
  _settings: unknown,
  meta: GitDiffMeta,
): Promise<GitDiffImageResult> => {
  return {
    left:
      left && meta.left
        ? {
            data: left,
            type: meta.left.mimeType,
          }
        : null,
    right:
      right && meta.right
        ? {
            data: right,
            type: meta.right.mimeType,
          }
        : null,
  };
};
