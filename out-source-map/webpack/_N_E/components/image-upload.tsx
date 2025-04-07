import Tracking from 'lib/tracking';
import { useCallback, useEffect, useState } from 'react';
import { DiffSide } from 'types/diffSide';
import { BROWSER_SUPPORTED_TYPES, IMAGE_FILE_TYPES } from 'types/image-types';
import DiffUploadDropContainer from './new/diff-upload/diff-upload-drop-container';
import DiffUploadDropzone from './new/diff-upload/diff-upload-dropzone';
import { DiffInputType } from 'types/diff-input-type';
import ImageSvg from 'components/shared/icons/image.svg';
import MessageError from 'types/message-error';
import { ImageDiffState, ImageDiffStateDefault } from 'types/image-diff';
import DiffUploadFileViewer from './new/diff-upload/diff-upload-file-viewer';
import css from './image-upload.module.css';
import DiffUploadHeaderMini from './new/diff-upload/diff-upload-header-mini';
import LoadingCircle from './shared/loaders/loading-circle';
import { getFileExtension } from 'lib/get-file-extension';
import { sendFileToBucket } from 'lib/s3-bucket';
import { RecordingInfo } from 'types/recordingInfo';
import { AccessErrorInfo } from './file-access-error-modal';

interface ImageUploadProps {
  side: DiffSide;
  showDropzone: boolean;
  initialFilePath?: string;
  state: ImageDiffState;
  setState: (newState: ImageDiffState) => void;
  recordingInfo?: RecordingInfo;
  setAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
  setUploadedPath: (filePath: string) => void;
}

enum ImageUploadState {
  EMPTY = 'empty',
  LOADING = 'loading', // Mainly for large files (usually raw images)
  FILE_LOADED = 'file-loaded',
}

export default function ImageUpload({
  side,
  showDropzone,
  initialFilePath,
  state,
  setState,
  recordingInfo,
  setAccessErrorInfo,
  setUploadedPath,
}: ImageUploadProps) {
  const [error, setError] = useState<MessageError>();
  const [uploadState, setUploadState] = useState<ImageUploadState>(
    ImageUploadState.EMPTY,
  );

  const loadImageState = useCallback(
    (file: File, image: HTMLImageElement, buffer?: ArrayBuffer) => {
      if (state.url !== ImageDiffStateDefault.url) {
        URL.revokeObjectURL(state.url);
      }

      setState({
        fileName: file.name,
        filePath: file.path,
        height: image.height,
        width: image.width,
        size: file.size,
        url: image.src,
        arrayBuffer: buffer,
      });
      setUploadState(ImageUploadState.FILE_LOADED);
    },
    [setState, state.url],
  );

  const handleFileUpload = useCallback(
    // uploadMethod was also originally unused. Keeping here in case it's needed in the future.
    (file: File, _uploadMethod: 'dropzone' | 'result-header' | 'file-path') => {
      if (recordingInfo?.isRecording && recordingInfo?.isSavingFiles) {
        sendFileToBucket(
          file,
          recordingInfo.sessionId,
          side,
          DiffInputType.IMAGE,
        );
      }
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadstart = () => {
        setUploadState(ImageUploadState.LOADING);
      };
      reader.onloadend = async () => {
        const image = new Image();
        let buffer = reader.result as ArrayBuffer;

        const extension = getFileExtension(file.name, buffer);
        if (!extension) {
          throw new Error('Unsupported file extension.');
        }

        const isBrowserSupported = BROWSER_SUPPORTED_TYPES.includes(
          '.' + extension.toLowerCase(),
        );

        if (!isBrowserSupported) {
          Tracking.trackEvent('Started WebP conversion', {
            type: extension,
          });
          const convertToWebP = (
            await import('lib/convert/webp/convert-to-webp')
          ).default;
          buffer = await convertToWebP(file.name, buffer, extension);
        }
        const blob = new Blob([buffer]);
        image.onload = () => loadImageState(file, image, buffer);
        image.src = URL.createObjectURL(blob);
      };
    },
    [loadImageState, side, recordingInfo],
  );

  const uploadFromPath = async (
    filePath: string,
    isFromRecentFile?: boolean,
  ) => {
    const { fetchLocalFile } = await import('lib/fetch-local-file');

    const response = await fetchLocalFile({
      path: filePath,
    });

    const { FileAccessErrors } = await import('types/file-access-errors');

    setUploadedPath(filePath);

    if (!response.ok) {
      setAccessErrorInfo({
        type: isFromRecentFile
          ? FileAccessErrors.RECENT_FILE
          : FileAccessErrors.RECENT_DIFF,
        error: response.error,
      });
      return;
    }

    handleFileUpload(response.file, 'file-path');
  };

  // ELECTRON FOLDER AND RECENT DIFFS ONLY - useEffect for loading a file when filePathFromUrl is provided.
  useEffect(() => {
    if (initialFilePath) {
      uploadFromPath(initialFilePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount only

  return showDropzone ? (
    <DiffUploadDropContainer
      isDropzone={uploadState === ImageUploadState.EMPTY}
    >
      {uploadState === ImageUploadState.EMPTY && (
        <DiffUploadDropzone
          type={DiffInputType.IMAGE}
          side={side}
          svg={ImageSvg}
          fileTypeText="image"
          acceptedFileTypes={IMAGE_FILE_TYPES}
          error={error}
          setError={setError}
          handleFileUpload={(file) => handleFileUpload(file, 'dropzone')}
          handleUploadFromPath={uploadFromPath}
        />
      )}
      {uploadState === ImageUploadState.LOADING && (
        <>
          <LoadingCircle size="large" style="primary" />
          <span>Loading image...</span>
        </>
      )}
      {state.url && uploadState === ImageUploadState.FILE_LOADED && (
        <DiffUploadFileViewer
          svg={ImageSvg}
          filename={state.fileName}
          filePath={state.filePath}
          fileSize={state.size}
          handleClose={() => {
            URL.revokeObjectURL(state.url);
            setState(ImageDiffStateDefault);
            setUploadState(ImageUploadState.EMPTY);
          }}
        >
          <img className={css.preview} src={state.url} alt={state.fileName} />
        </DiffUploadFileViewer>
      )}
    </DiffUploadDropContainer>
  ) : (
    <DiffUploadHeaderMini
      type={DiffInputType.IMAGE}
      side={side}
      svg={ImageSvg}
      acceptedFileTypes={Object.values(IMAGE_FILE_TYPES).flat()}
      handleFileUpload={(file) => handleFileUpload(file, 'result-header')}
      filename={state.fileName}
      uploadButtonLabel="Open file"
      uploadFromPath={uploadFromPath}
    />
  );
}
