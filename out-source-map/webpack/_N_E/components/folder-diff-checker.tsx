import { FolderOutput } from './new/folder-diff/folder-output';
import css from './folder-diff-checker.module.css';
import { FolderUpload } from './new/folder-diff/folder-upload';
import { useEffect, useState } from 'react';
import Tracking from 'lib/tracking';
import { DiffInputType } from 'types/diff-input-type';
import IconButton from 'components/shared/icon-button';
import SwitchSvg from 'components/shared/icons/switch.svg';
import cx from 'classnames';
import dynamic from 'next/dynamic';
import { AccessErrorInfo } from 'components/file-access-error-modal';

export type FolderDiffState = {
  path: string;
  files: FolderDiffFile[];
};

export type FolderDiffFile = {
  lastModified: number;
  name: string;
  size: number;

  /**
   * Absolute path
   *
   * e.g. /Users/johndoe/programming/foo/bar.ts
   */
  path: string;
  /**
   * Path relative to folder being diffed
   *
   * e.g. if we're diffing `programming/`:
   *
   * relativePath = foo/bar.ts
   */
  relativePath: string;
  hash: string;
};

export const FolderDiffStateDefault: FolderDiffState = {
  path: '',
  files: [],
};

const FolderDiffChecker: React.FC<{
  initialLeftPath?: string;
  initialRightPath?: string;
}> = ({ initialLeftPath, initialRightPath }) => {
  const [leftState, setLeftState] = useState<FolderDiffState>();
  const [rightState, setRightState] = useState<FolderDiffState>();

  // these are only for error handling
  const [leftUploadedPath, setLeftUploadedPath] = useState<string>('');
  const [rightUploadedPath, setRightUploadedPath] = useState<string>('');

  const [leftAccessErrorInfo, setLeftAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);
  const [rightAccessErrorInfo, setRightAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);

  const showDropzone = !leftState || !rightState;

  // TODO: We hate useEffects! It would be much easier to keep track when the diff is completed by
  // adding a callback function whenever we add a "find difference" button to this diff type.
  // this comment also exists in image-diff-checker.tsx
  useEffect(() => {
    const run = async () => {
      if (leftState && rightState) {
        const { addRecentDiff } = await import(
          'components/new/recent-diffs/commands/recent-diff-utils'
        );
        addRecentDiff({
          left: { filePath: leftState.path },
          right: { filePath: rightState.path },
          diffType: DiffInputType.FOLDER,
        });
        Tracking.trackEvent('Created diff', { diffType: DiffInputType.FOLDER });
      }
    };
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      run();
    }
  }, [leftState, rightState]);

  return (
    <div
      className={cx(css.folderDiffChecker, {
        [css.dropzone]: showDropzone,
      })}
    >
      <div className={css.uploadContainer}>
        <div className={css.uploadContent}>
          <FolderUpload
            side="left"
            showDropzone={showDropzone}
            diffState={leftState}
            setDiffState={setLeftState}
            initialFolderPath={initialLeftPath}
            setAccessErrorInfo={setLeftAccessErrorInfo}
            setUploadedPath={setLeftUploadedPath}
          />
        </div>

        {!showDropzone && (
          <IconButton
            size="small"
            style="text"
            tone="base"
            svg={SwitchSvg}
            onClick={() => {
              const tempLeftState = leftState;
              setLeftState(rightState);
              setRightState(tempLeftState);
            }}
            aria-label="Swap diffs"
            className={css.swapButton}
          />
        )}
        <div className={css.uploadContent}>
          <FolderUpload
            side="right"
            showDropzone={showDropzone}
            diffState={rightState}
            setDiffState={setRightState}
            initialFolderPath={initialRightPath}
            setAccessErrorInfo={setRightAccessErrorInfo}
            setUploadedPath={setRightUploadedPath}
          />
        </div>
      </div>

      {leftState && rightState && (
        <FolderOutput leftFolder={leftState} rightFolder={rightState} />
      )}
      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <FileAccessErrorModal
          leftAccessErrorInfo={leftAccessErrorInfo}
          setLeftAccessErrorInfo={setLeftAccessErrorInfo}
          rightAccessErrorInfo={rightAccessErrorInfo}
          setRightAccessErrorInfo={setRightAccessErrorInfo}
          leftFilePath={leftUploadedPath}
          rightFilePath={rightUploadedPath}
          diffInputType={DiffInputType.FOLDER}
        />
      )}
    </div>
  );
};

const FileAccessErrorModal = dynamic(
  () => import('components/file-access-error-modal'),
  { ssr: false },
);

export default FolderDiffChecker;
