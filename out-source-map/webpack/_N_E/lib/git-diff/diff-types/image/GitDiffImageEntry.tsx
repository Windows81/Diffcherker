import * as React from 'react';
import { useAtomValue } from 'jotai';
import { GitDiffType } from '../../types';
import { GitDiffDataProps } from '../../GitDiffDataProps';
import css from './GitDiffImageEntry.module.css';
import { ImageOutput } from 'components/image-output';

export const GitDiffImageEntry: React.FC<
  GitDiffDataProps<GitDiffType.image>
> = ({ file, fileAtom }) => {
  const { fileDataAtom } = useAtomValue(fileAtom);
  const fileData = useAtomValue(fileDataAtom);

  // Ensure file URLs have the "file://" prefix
  // This is necessary for the Electron renderer to read local files
  const oldUrl = !file.oldUrl
    ? ''
    : file.oldUrl.startsWith('file://')
      ? file.oldUrl
      : `file://${file.oldUrl}`;
  const newUrl = !file.newUrl
    ? ''
    : file.newUrl.startsWith('file://')
      ? file.newUrl
      : `file://${file.newUrl}`;

  const oldArrayBuffer = fileData?.[0]?.buffer;
  const newArrayBuffer = fileData?.[1]?.buffer;

  return (
    <div className={css.mainContainer}>
      <ImageOutput
        leftState={{
          fileName: file.name,
          url: oldUrl,
          size: file.oldSize ?? 0,
          arrayBuffer:
            oldArrayBuffer instanceof ArrayBuffer ? oldArrayBuffer : undefined,

          // TODO properly set these values
          width: -1,
          height: -1,
        }}
        rightState={{
          fileName: file.name,
          url: newUrl,
          size: file.newSize ?? 0,
          arrayBuffer:
            newArrayBuffer instanceof ArrayBuffer ? newArrayBuffer : undefined,

          // TODO properly set these values
          width: -1,
          height: -1,
        }}
        showExportButton={false}
      />
    </div>
  );
};
