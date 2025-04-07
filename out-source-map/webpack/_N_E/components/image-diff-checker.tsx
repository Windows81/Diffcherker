import css from './image-diff-checker.module.css';
import cx from 'classnames';
import ImageUpload from './image-upload';
import { useCallback, useEffect, useState } from 'react';
import { ImageDiffState, ImageDiffStateDefault } from 'types/image-diff';
import SwitchSvg from 'components/shared/icons/switch.svg';
import IconButton from 'components/shared/icon-button';
import { ImageOutput } from './image-output';
import Tracking from 'lib/tracking';
import { DiffInputType } from 'types/diff-input-type';
import { RecordingInfo } from 'types/recordingInfo';
import { AccessErrorInfo } from './file-access-error-modal';
import dynamic from 'next/dynamic';

interface ImageDiffCheckerProps {
  initialLeftPath?: string;
  initialRightPath?: string;
  recordingInfo?: RecordingInfo;
  diffOrigin?: string;
}

const ImageDiffChecker: React.FC<ImageDiffCheckerProps> = ({
  initialLeftPath,
  initialRightPath,
  recordingInfo,
  diffOrigin,
}) => {
  const [leftState, setLeftState] = useState<ImageDiffState>(
    ImageDiffStateDefault,
  );
  const [rightState, setRightState] = useState<ImageDiffState>(
    ImageDiffStateDefault,
  );

  // these are only for error handling
  const [leftUploadedPath, setLeftUploadedPath] = useState<string>('');
  const [rightUploadedPath, setRightUploadedPath] = useState<string>('');

  const [leftAccessErrorInfo, setLeftAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);
  const [rightAccessErrorInfo, setRightAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);

  const swap = useCallback(() => {
    const temp = leftState;
    setLeftState(rightState);
    setRightState(temp);
  }, [leftState, rightState]);

  const showDropzone = !(leftState.url && rightState.url);

  useEffect(() => {
    if (!showDropzone) {
      Tracking.trackEvent('Created diff', { diffType: DiffInputType.IMAGE });
    }
  }, [showDropzone]);

  // TODO: We hate useEffects! It would be much easier to keep track when the diff is completed by
  // adding a callback function whenever we add a "find difference" button to this diff type.
  // this comment also exists in folder-diff-checker.tsx
  useEffect(() => {
    const run = async () => {
      const leftPath = leftState.filePath;
      const rightPath = rightState.filePath;

      if (leftPath && rightPath) {
        const { addRecentDiff } = await import(
          'components/new/recent-diffs/commands/recent-diff-utils'
        );
        addRecentDiff({
          left: { filePath: leftPath },
          right: { filePath: rightPath },
          diffType: DiffInputType.IMAGE,
        });
      }
    };

    if (process.env.NEXT_PUBLIC_IS_ELECTRON && leftState && rightState) {
      run();
    }
  }, [leftState, rightState]);

  return (
    <>
      <div
        className={cx(css.imageDiffChecker, {
          [css.dropzone]: showDropzone,
        })}
      >
        {/* This is the file input "component", its not extracted out to its own component since
      the only logic its handling is swapping, which is a singular function and simple enough to keep in here. */}
        <div className={cx(css.uploadContainer)}>
          <div className={css.uploadContent}>
            <ImageUpload
              side="left"
              showDropzone={showDropzone}
              initialFilePath={initialLeftPath}
              state={leftState}
              setState={setLeftState}
              recordingInfo={recordingInfo}
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
              onClick={swap}
              aria-label="Swap diffs"
              className={css.swapButton}
            />
          )}
          <div className={css.uploadContent}>
            <ImageUpload
              side="right"
              showDropzone={showDropzone}
              initialFilePath={initialRightPath}
              state={rightState}
              setState={setRightState}
              recordingInfo={recordingInfo}
              setAccessErrorInfo={setRightAccessErrorInfo}
              setUploadedPath={setRightUploadedPath}
            />
          </div>
        </div>
        {!showDropzone && (
          <ImageOutput leftState={leftState} rightState={rightState} />
        )}
      </div>
      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <FileAccessErrorModal
          leftAccessErrorInfo={leftAccessErrorInfo}
          setLeftAccessErrorInfo={setLeftAccessErrorInfo}
          rightAccessErrorInfo={rightAccessErrorInfo}
          setRightAccessErrorInfo={setRightAccessErrorInfo}
          leftFilePath={leftUploadedPath}
          rightFilePath={rightUploadedPath}
          diffInputType={DiffInputType.IMAGE}
          diffOrigin={diffOrigin}
        />
      )}
    </>
  );
};

const FileAccessErrorModal = dynamic(
  () => import('components/file-access-error-modal'),
  { ssr: false },
);

export default ImageDiffChecker;
