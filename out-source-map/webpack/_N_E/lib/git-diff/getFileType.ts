import mime from 'mime-types';
import isUtf8 from 'isutf8';
import { filetypemime } from 'magic-bytes.js';

/**
 * Determine a best guess mime-type based on a given file name and a
 * given input buffer. The input buffer is first used to try and
 * detect magic bytes; if that fails file extension is used; if that
 * fails then basic text detection is used.
 * TODO(@izaakschroeder): There are likely specific edge cases here we
 * would want to account for. I don't know of them off-hand.
 * @param name Name of the file.
 * @param buf The contents of the file.
 * @returns The selected mime-type and if the file is text-like or not.
 */
export const getFileType = async (
  name: string,
  buf: Uint8Array | null | undefined,
) => {
  if (!buf) {
    return null;
  }
  const isText = isUtf8(buf);
  const magic = await filetypemime(buf);
  const ext = mime.lookup(name);

  if (magic.length > 0) {
    // because sometimes filetypemime returns a list of ALL possible mime types
    // we should do an extra check with the extension to make sure we return the correct filetype
    const mimeType = ext && magic.includes(ext) ? ext : magic[0];
    return { isText, mimeType };
  }

  if (ext) {
    return {
      isText,
      mimeType: ext,
    };
  }
  if (isText) {
    return {
      mimeType: 'text/plain',
      isText: true,
    };
  }
  return {
    mimeType: 'application/octet-stream',
    isText: false,
  };
};
