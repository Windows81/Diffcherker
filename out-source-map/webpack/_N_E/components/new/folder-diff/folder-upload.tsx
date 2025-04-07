import LoadingCircle from 'components/shared/loaders/loading-circle';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { DiffInputType } from 'types/diff-input-type';
import DiffUploadDropContainer from '../diff-upload/diff-upload-drop-container';
import DiffUploadDropzone from '../diff-upload/diff-upload-dropzone';
import IconButton from 'components/shared/icon-button';
import FolderSvg from 'web/components/shared/icons/folder.svg';
import {
  FolderDiffFile,
  FolderDiffState,
  FolderDiffStateDefault,
} from 'components/folder-diff-checker';
import { DiffSide } from 'types/diffSide';
import { DropEvent } from 'react-dropzone';
import getFolderPathFromFile from 'lib/get-folder-path-from-file';
import Tracking from 'lib/tracking';
import path from 'path';
import MessageError from 'types/message-error';
import css from './folder-upload.module.css';
import DiffUploadFileInfo from '../diff-upload/diff-upload-file-info';
import DiffUploadButton from '../diff-upload/diff-upload-button';
import CancelSvg from 'components/shared/icons/cancel.svg';
import dynamic from 'next/dynamic';
import { AccessErrorInfo } from 'components/file-access-error-modal';

enum FolderUploadState {
  EMPTY = 'empty',
  LOADING = 'loading',
  FILE_LOADED = 'file-loaded',
}

interface FolderUploadProps {
  side: DiffSide;
  diffState?: FolderDiffState;
  setDiffState: (newState: FolderDiffState) => void;
  showDropzone: boolean;
  initialFolderPath?: string;
  setAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
  setUploadedPath: (filePath: string) => void;
}

export const FolderUpload = ({
  side,
  diffState,
  showDropzone,
  setDiffState,
  initialFolderPath,
  setAccessErrorInfo,
  setUploadedPath,
}: FolderUploadProps) => {
  const [error, setErrorMessage] = useState<MessageError>();
  const [uploadState, setUploadState] = useState<FolderUploadState>(
    FolderUploadState.EMPTY,
  );
  const [openRecentFileDropdown, setOpenRecentFileDropdown] = useState(false);
  const dropdownButtonRef = useRef<HTMLDivElement>(null);

  const filename = diffState?.path ?? '';
  const fileSize = useMemo(
    () => diffState?.files.reduce((acc, file) => acc + file.size, 0) ?? 0,
    [diffState],
  );

  const uploadFromPath = async (
    folderPath: string,
    isFromRecentFile?: boolean,
  ) => {
    setUploadState(FolderUploadState.LOADING);

    const { fetchLocalFolder } = await import('lib/fetch-local-folder');
    const response = await fetchLocalFolder(folderPath);

    const { FileAccessErrors } = await import('types/file-access-errors');

    setUploadedPath(folderPath);

    if (response.error) {
      setAccessErrorInfo({
        type: isFromRecentFile
          ? FileAccessErrors.RECENT_FILE
          : FileAccessErrors.RECENT_DIFF,
        error: response.error,
      });
      setUploadState(FolderUploadState.EMPTY);
      return;
    }

    setUploadState(FolderUploadState.FILE_LOADED);

    setDiffState({
      path: folderPath,
      files: response.data,
    });
  };

  useEffect(() => {
    if (initialFolderPath) {
      uploadFromPath(initialFolderPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount only

  const handleFolderUpload = useCallback(
    async (event: DropEvent) => {
      setUploadState(FolderUploadState.LOADING);

      let rootFolderPath: string = '';
      let folderDiffFiles: FolderDiffFile[] = []; // files formatted specifically for folder diffing
      let eventFiles: File[] = []; // normal files that react-dropzone expects this function to return

      const isChangeEvent =
        'target' in event && event.target instanceof HTMLInputElement;
      if (isChangeEvent) {
        const files = event.target?.files;
        if (files && files.length > 0) {
          rootFolderPath = getFolderPathFromFile(files[0]);
          eventFiles = Array.from(files);

          folderDiffFiles = await Promise.all(
            eventFiles.map(async (file) => ({
              path: file.path,
              size: file.size,
              name: file.name,
              lastModified: file.lastModified,

              // webkitRelativePath contains the relative root folder
              // the git diff view doesn't actually want this so we have to do some parsing
              relativePath: file.webkitRelativePath
                .split(path.sep)
                .slice(1)
                .join(path.sep),

              // TODO consider parallelizing this for better performance
              hash: await getFileHash(file),
            })),
          );
        }
      }

      const isDragEvent = 'dataTransfer' in event;
      if (isDragEvent) {
        const items = event.dataTransfer?.items; // contains children file metadata
        const rootFolder = event.dataTransfer?.files?.[0]; // contains root folder metadata (ironically)

        const isFile = rootFolder && rootFolder.type.length > 0;
        if (isFile) {
          setErrorMessage(
            new MessageError({
              title: 'Unsupported format',
              message: `Supported formats: folders`,
              type: 'user',
            }),
          );
          setUploadState(FolderUploadState.EMPTY);
          return [];
        }

        if (rootFolder && items) {
          rootFolderPath = rootFolder.path;
          eventFiles = Array.from(event.dataTransfer.files);

          // unlike change events, drag events produce a tree structure so we have to use a special recursive function to parse
          folderDiffFiles = await getFilesFromDataTransferItems(
            items,
            rootFolder.name,
          );
        }
      }

      if (folderDiffFiles.length === 0) {
        // note: getFilesFromEvent fires for change events with empty folders, but doesn't for drop events.
        //       so this tracking should only ever apply for drag events
        Tracking.trackEvent('Failed uploading file to diff', {
          diffInputType: DiffInputType.FOLDER,
          reason: 'Folder seems empty',
          side,
          uploadMethod: showDropzone ? 'dropzone' : 'diff-input-header',
        });
        setUploadState(FolderUploadState.EMPTY);
        return [];
      }

      setUploadState(FolderUploadState.FILE_LOADED);
      setDiffState({
        path: rootFolderPath,
        files: folderDiffFiles.filter((file) => file.name !== '.DS_Store'),
      });

      Tracking.trackEvent('Uploaded file to diff', {
        diffInputType: DiffInputType.FOLDER,
        side,
        uploadMethod: showDropzone ? 'dropzone' : 'diff-input-header',
      });

      return eventFiles;
    },
    [setDiffState, side],
  );

  return showDropzone ? (
    <DiffUploadDropContainer
      isDropzone={uploadState === FolderUploadState.EMPTY}
    >
      {uploadState === FolderUploadState.EMPTY && (
        <DiffUploadDropzone
          type={DiffInputType.FOLDER}
          side={side}
          svg={FolderSvg}
          fileTypeText="a folder"
          acceptedFileTypes={{}}
          handleFolderUpload={handleFolderUpload}
          handleUploadFromPath={uploadFromPath}
          error={error}
          setError={setErrorMessage}
        />
      )}
      {uploadState === FolderUploadState.LOADING && (
        <>
          <LoadingCircle size="large" style="primary" />
          <span>Loading folder...</span>
        </>
      )}
      {diffState && uploadState === FolderUploadState.FILE_LOADED && (
        <div className={css.fileInfoContainer}>
          <DiffUploadFileInfo
            svg={FolderSvg}
            filename={filename ? path.basename(filename) : ''}
            filePath={filename}
            fileSize={fileSize}
            inputFileType={DiffInputType.FOLDER}
          >
            <IconButton
              style="text"
              tone="base"
              svg={CancelSvg}
              aria-label={`Remove ${filename}`}
              onClick={() => {
                setDiffState(FolderDiffStateDefault);
                setUploadState(FolderUploadState.EMPTY);
              }}
            />
          </DiffUploadFileInfo>
        </div>
      )}
    </DiffUploadDropContainer>
  ) : (
    <div className={css.headerUpload}>
      <div className={css.buttonFileIntoContainer}>
        <DiffUploadButton
          type={DiffInputType.FOLDER}
          side={side}
          label="Open folder"
          acceptedFileTypes={[]}
          handleFolderUpload={handleFolderUpload}
          fullWidth
        >
          <DiffUploadFileInfo
            svg={FolderSvg}
            filename={filename ? path.basename(filename) : ''}
            filePath={filename}
            fileSize={fileSize}
            inputFileType={DiffInputType.FOLDER}
          />
        </DiffUploadButton>
      </div>

      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <>
          <div className={css.dropdownButtonContainer}>
            <RecentFilesDropdownButton
              diffType={DiffInputType.FOLDER}
              openDropdown={openRecentFileDropdown}
              setOpenDropdown={setOpenRecentFileDropdown}
              buttonRef={dropdownButtonRef}
            />
          </div>
          <RecentFilesDropdownMenu
            isOpen={openRecentFileDropdown}
            diffType={DiffInputType.FOLDER}
            onItemClick={(recentFile) => {
              uploadFromPath(recentFile.filePath, true);
            }}
            setOpen={setOpenRecentFileDropdown}
            buttonRef={dropdownButtonRef}
            variant="editHeaderFolder"
          />
        </>
      )}
    </div>
  );
};

async function getFilesFromDataTransferItems(
  items: DataTransferItemList,
  rootFolderName: string,
): Promise<FolderDiffFile[]> {
  const allFiles: FolderDiffFile[] = [];

  async function traverseFileTree(entry: FileSystemEntry) {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) =>
        (entry as FileSystemFileEntry).file(resolve),
      );

      // data transfer items don't have webkitRelativePath, so we have to determine relative path this way
      const rootFolderIndex = file.path.indexOf(rootFolderName);
      const relativePath = file.path.slice(
        rootFolderIndex + rootFolderName.length + path.sep.length,
      );

      // TODO consider parallelizing this for better performance
      const hash = await getFileHash(file);

      allFiles.push({
        name: file.name,
        size: file.size,
        path: file.path,
        lastModified: file.lastModified,
        relativePath,
        hash,
      });
      return;
    }

    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve) =>
        reader.readEntries(resolve),
      );

      await Promise.all(
        entries.map((childEntry) => traverseFileTree(childEntry)),
      );
    }
  }

  const itemEntries = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (entry) {
      itemEntries.push(entry);
    }
  }

  await Promise.all(itemEntries.map((entry) => traverseFileTree(entry)));
  return allFiles;
}

const getFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(buffer);
  let hash = 0;

  for (let i = 0; i < fileBytes.length; i++) {
    hash = (hash << 5) - hash + fileBytes[i];
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
};

const RecentFilesDropdownButton = dynamic(
  () => import('components/new/recent-diffs/recent-files-dropdown-button'),
  {
    ssr: false,
  },
);

const RecentFilesDropdownMenu = dynamic(
  () => import('components/new/recent-diffs/recent-files-dropdown-menu'),
  {
    ssr: false,
  },
);
