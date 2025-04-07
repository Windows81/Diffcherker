export enum GitDiffType {
  text = 'text',
  image = 'image',
  document = 'document',
  spreadsheet = 'spreadsheet',
}

export interface FileEntry {
  /**
   * Session to which this entry belongs. This can be used for cleanup
   * when the session is destroyed.
   */
  sessionId: string;

  /**
   * Full name of the file.
   * @example foo/bar/baz.txt
   */
  name: string;

  /**
   * Hash of the old file. `null` if the file never existed before.
   * @example adc83b19e793491b1c6ea0fd8b46cd9f32e592fc
   */
  oldHex: string | null;

  /**
   * Hash of new file. `null` if the file was deleted.
   * @example adc83b19e793491b1c6ea0fd8b46cd9f32e592fc
   */
  newHex: string | null;

  /**
   * Size, in bytes, of the previous file. `null` if the file never
   * existed before.
   * @example 121
   */
  oldSize: number | null;

  /**
   * Size, in bytes, of the new file. `null` if the file was deleted.
   * @example 121
   */
  newSize: number | null;

  oldUrl: string | null;

  newUrl: string | null;

  /**
   * New name of file. Only exists if file was renamed (i.e. shows "rename" in `git status`).
   */
  newName?: string;
}

export interface GitDiffSideMeta {
  mimeType: string;
  isText: boolean;
}

export type GitDiffFileData = [Uint8Array | null, Uint8Array | null];

export interface GitDiffMeta {
  allowed: GitDiffType[];
  left?: GitDiffSideMeta | null | undefined;
  right?: GitDiffSideMeta | null | undefined;
}
