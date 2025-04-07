import { filetypeextension } from 'magic-bytes.js';

// note: returned file extension has no leading dot
export const getFileExtension = (filePath: string, buffer: ArrayBuffer) => {
  /**
   * try getting extension from filename first
   */

  // important to get filename first since path may contain dots not part of the extension
  const fileName = filePath.split('/').at(-1);
  if (!fileName) {
    return undefined;
  }

  const fileNameParts = fileName.split('.');
  if (fileNameParts.length > 1) {
    const extensionFromFilename = fileNameParts.pop()?.toLowerCase();
    return extensionFromFilename;
  }

  /**
   * try getting extension from buffer
   */
  const possibleBufferExtensions = filetypeextension(new Uint8Array(buffer));
  if (possibleBufferExtensions.length > 0) {
    const extensionFromBuffer = possibleBufferExtensions[0].toLowerCase();
    return extensionFromBuffer;
  }

  return undefined;
};
