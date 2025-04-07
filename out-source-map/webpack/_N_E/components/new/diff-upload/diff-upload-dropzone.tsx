import React, { useCallback, useMemo } from 'react';
import {
  Accept,
  DropzoneOptions,
  FileRejection,
  useDropzone,
} from 'react-dropzone';

import css from './diff-upload-dropzone.module.css';
import cx from 'classnames';
import MessageError from 'types/message-error';
import DropzoneInputInstruction from './dropzone-input-instruction';
import MessageBanner from 'components/shared/message-banner';

import dynamic from 'next/dynamic';

import { DiffInputType } from 'types/diff-input-type';
import { DiffSide } from 'types/diffSide';
import DiffUploadDropzoneButton from './diff-upload-dropzone-button';
import FolderSvg from 'web/components/shared/icons/folder.svg';

type DiffUploadDropzoneProps = {
  type: DiffInputType;
  side: DiffSide;
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  fileTypeText: string;
  acceptedFileTypes: Accept;
  acceptedFileTypeText?: string;
  error?: MessageError;
  setError: (error?: MessageError) => void;
  onFileRejected?: (rejectedFileMimeType: string) => void;
  handleFileUpload?: (file: File) => void;
  handleFolderUpload?: DropzoneOptions['getFilesFromEvent'];
  handleUploadFromPath: (path: string, isFromRecentFile?: boolean) => void;
};

const subInstructions = {
  [DiffInputType.EXCEL]: 'xlsx, xls, csv, tsv, etc',
  [DiffInputType.PDF]: 'doc, docx, pdf, etc',
  [DiffInputType.IMAGE]: 'jpg, png, webp, gif, heic, etc',
  [DiffInputType.FOLDER]: 'or click to browse files',
};

const DiffUploadDropzone: React.FC<DiffUploadDropzoneProps> = ({
  type,
  side,
  svg,
  fileTypeText,
  acceptedFileTypes,
  acceptedFileTypeText,
  error,
  handleFileUpload,
  setError,
  onFileRejected,
  handleFolderUpload,
  handleUploadFromPath,
}) => {
  const unsupportedFileError = useMemo(
    () =>
      new MessageError({
        title: 'Unsupported file format',
        message: `Supported formats: ${
          acceptedFileTypeText ||
          Object.values(acceptedFileTypes)
            .flat()
            .filter((item, i, arr) => arr.indexOf(item) === i) // removes duplicates
            .join(', ')
        }`,
        type: 'user',
      }),
    [type, acceptedFileTypeText, acceptedFileTypes],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!handleFileUpload) {
        return;
      }

      if (rejectedFiles.length > 0) {
        setError(unsupportedFileError);
        if (rejectedFiles.length === 1) {
          onFileRejected?.(rejectedFiles[0].file.type);
        }
        return;
      } else if (acceptedFiles.length === 0) {
        console.error(`No files uploaded to ${side} DiffUploadDropzone!`);
      } else {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    [handleFileUpload, onFileRejected, setError, side, unsupportedFileError],
  );

  const clearError = useCallback(() => {
    setError();
  }, [setError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      // for folder diffs this can be undefined since we rely on getFilesFromEvent to handle both drop and dialog events
      onDrop: type === DiffInputType.FOLDER ? undefined : onDrop,
      onDragEnter: clearError, // clear error when dragging a file over
      onFileDialogCancel: clearError, // clear error when cancelling file dialog
      accept: acceptedFileTypes,
      multiple: false,
      useFsAccessApi: false,

      // we destructure here since directly setting undefined throws an error for some unholy reason
      ...(handleFolderUpload && type === DiffInputType.FOLDER
        ? { getFilesFromEvent: handleFolderUpload }
        : {}),
    });

  return (
    <div
      className={cx(
        css.dropzone,
        isDragActive && css.dragging,
        isDragActive && isDragReject && css.reject,
      )}
      {...getRootProps()}
    >
      <input
        {...getInputProps({
          webkitdirectory: type === DiffInputType.FOLDER ? 'true' : undefined,
        })}
      />
      <div className={css.content}>
        {isDragActive ? (
          isDragReject ? (
            <MessageBanner
              error={unsupportedFileError}
              className={css.dropRejectBanner}
              centered
            />
          ) : (
            <>
              <DropzoneInputInstruction
                svg={svg}
                instruction={`Ready to accept ${fileTypeText}`}
                subInstruction={`${subInstructions[type as Exclude<DiffInputType, DiffInputType.TEXT>]}`}
              />
              <div className={css.buttons}>
                {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                  <RecentFilesDropdown
                    type={type}
                    handleUploadFromPath={(path) =>
                      handleUploadFromPath(path, true)
                    }
                  />
                )}
                <DiffUploadDropzoneButton text="Browse" svg={FolderSvg} />
              </div>
            </>
          )
        ) : (
          <>
            {error && (
              <MessageBanner
                error={error}
                noIndent
                className={css.errorBanner}
              />
            )}
            <DropzoneInputInstruction
              svg={svg}
              instruction={`Drop ${fileTypeText} here`}
              subInstruction={`${subInstructions[type as Exclude<DiffInputType, DiffInputType.TEXT>]}`}
            />
            <div className={css.buttons}>
              {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                <RecentFilesDropdown
                  type={type}
                  handleUploadFromPath={(path) =>
                    handleUploadFromPath(path, true)
                  }
                />
              )}
              <DiffUploadDropzoneButton text="Browse" svg={FolderSvg} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const RecentFilesDropdown = dynamic(
  () => import('web/components/new/recent-diffs/recent-files-dropdown'),
  {
    ssr: false,
  },
);

export default DiffUploadDropzone;
