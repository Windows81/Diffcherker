import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  deleteRecentDiff,
  deleteRecentFile,
} from 'components/new/recent-diffs/commands/recent-diff-utils';
import Button from 'components/shared/button';
import Modal from 'components/shared/modal';

import css from './file-access-error-modal.module.css';
import { DiffInputType } from 'types/diff-input-type';
import { FileAccessErrors } from 'types/file-access-errors';

export type AccessErrorInfo = {
  type: FileAccessErrors;
  error: {
    code: string;
  };
} | null;

interface FileAccessErrorModalProps {
  leftAccessErrorInfo: AccessErrorInfo;
  setLeftAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
  rightAccessErrorInfo: AccessErrorInfo;
  setRightAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
  leftFilePath: string;
  rightFilePath: string;
  diffInputType: DiffInputType;
  diffOrigin?: string;
}

const FileAccessErrorModal: React.FC<FileAccessErrorModalProps> = ({
  leftAccessErrorInfo,
  setLeftAccessErrorInfo,
  rightAccessErrorInfo,
  setRightAccessErrorInfo,
  leftFilePath,
  rightFilePath,
  diffInputType,
  diffOrigin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasAnyError =
      leftAccessErrorInfo?.error || rightAccessErrorInfo?.error;

    setIsOpen(!!hasAnyError);
  }, [leftAccessErrorInfo, rightAccessErrorInfo]);

  const isFromFolder = diffOrigin === 'folder-diff';

  const isFolder = diffInputType === DiffInputType.FOLDER;
  const entry = isFolder ? 'folder' : 'file';
  const entries = isFolder ? 'folders' : 'files';
  const Entry = isFolder ? 'Folder' : 'File';
  const Entries = isFolder ? 'Folders' : 'Files';

  const getPluralErrorMessage = (accessErrorInfo: AccessErrorInfo) => {
    if (!accessErrorInfo) {
      return;
    }

    const code = accessErrorInfo.error.code;

    switch (code) {
      case undefined:
        return;
      case 'EPERM':
        return `Insufficient permissions to access ${entries} at "${leftFilePath}" and "${rightFilePath}".`;
      case 'ENOENT':
        return `${Entries} at "${leftFilePath}" and "${rightFilePath}" could not be found. Were they moved or deleted?`;
      default:
        return `An error occurred while accessing ${entries} at "${leftFilePath}" and "${rightFilePath}".`;
    }
  };

  const getSingularErrorMessage = (
    accessErrorInfo: AccessErrorInfo | null,
    filePath?: string,
  ) => {
    if (!accessErrorInfo) {
      return;
    }

    const code = accessErrorInfo.error.code;

    switch (code) {
      case 'EPERM':
        return `Insufficient permissions to access ${entry} at "${filePath}".`;
      case 'ENOENT':
        return `${Entry} at "${filePath}" could not be found. Was it moved or deleted?`;
      default:
        return `An error occurred while accessing ${entry} at "${filePath}".`;
    }
  };

  const closeModal = () => {
    // reset the access error info, we dont want to hang onto old data
    // specifically, this prevents having two recent file errors at the same time
    // in that case, the modal would always default to showing the left error
    setLeftAccessErrorInfo(null);
    setRightAccessErrorInfo(null);
    setIsOpen(false);
  };

  const leftHasDiffError =
    leftAccessErrorInfo?.type === FileAccessErrors.RECENT_DIFF;
  const rightHasDiffError =
    rightAccessErrorInfo?.type === FileAccessErrors.RECENT_DIFF;

  const leftHasFileError =
    leftAccessErrorInfo?.type === FileAccessErrors.RECENT_FILE;
  const rightHasFileError =
    rightAccessErrorInfo?.type === FileAccessErrors.RECENT_FILE;

  const hasFileError = leftHasFileError || rightHasFileError;

  const handleDelete = () => {
    if (leftHasFileError) {
      deleteRecentFile(leftFilePath, diffInputType);
    } else if (rightHasFileError) {
      deleteRecentFile(rightFilePath, diffInputType);
    } else {
      // there will be no recent text diff that will reference any file outside of docstorage
      // so we can safely delete the files
      deleteRecentDiff(leftFilePath, rightFilePath, diffInputType);
      router.push('/new-desktop-tab');
    }
    closeModal();
  };

  const title = (() => {
    if (leftHasDiffError && rightHasDiffError) {
      return `Error accessing ${entries}`;
    }

    return `Error accessing ${entry}`;
  })();

  const message = (() => {
    if (leftHasFileError) {
      return (
        <p>{getSingularErrorMessage(leftAccessErrorInfo, leftFilePath)}</p>
      );
    }

    if (rightHasFileError) {
      return (
        <p>{getSingularErrorMessage(rightAccessErrorInfo, rightFilePath)}</p>
      );
    }

    if (leftHasDiffError && rightHasDiffError) {
      return <p>{getPluralErrorMessage(leftAccessErrorInfo)}</p>;
    }

    if (leftHasDiffError || rightHasDiffError) {
      return (
        <>
          <p>{getSingularErrorMessage(leftAccessErrorInfo, leftFilePath)}</p>
          <p>{getSingularErrorMessage(rightAccessErrorInfo, rightFilePath)}</p>
        </>
      );
    }

    return <p>Error accessing one or more files</p>;
  })();

  const deleteMessage = (() => {
    if (hasFileError) {
      return 'Would you like to remove this from recent files?';
    }

    return 'Would you like to remove this from recent diffs?';
  })();

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title={title}>
      <div className={css.content}>
        {message}
        {!isFromFolder && <p className={css.deleteMessage}>{deleteMessage}</p>}
        <div className={css.buttonContainer}>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={closeModal}
          >
            Cancel
          </Button>
          {!isFromFolder && (
            <Button
              style="secondary"
              tone="red"
              size="large"
              fullWidth
              onClick={handleDelete}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FileAccessErrorModal;
