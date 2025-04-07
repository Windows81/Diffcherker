import { useState, useEffect, useCallback, useRef, SVGProps, FC } from 'react';
import css from './excel-upload.module.css';
import { DiffSide } from 'types/diffSide';
import type { FullProperties, WorkBook } from 'xlsx';
import { DiffInputType } from 'types/diff-input-type';
import Tracking from 'lib/tracking';
import { sendFileToBucket } from 'lib/s3-bucket';
import { RecordingInfo } from 'types/recordingInfo';
import { AccessErrorInfo } from './file-access-error-modal';
import DiffUploadFileViewer from './new/diff-upload/diff-upload-file-viewer';
import ExcelSettingsBar from './new/excel-diff/excel-input/excel-settings-bar';
import ExcelThumbnail from './new/excel-diff/excel-input/excel-thumbnail';
import DiffUploadDropContainer from './new/diff-upload/diff-upload-drop-container';
import DiffUploadDropzone from './new/diff-upload/diff-upload-dropzone';
import MessageError from 'types/message-error';
import LoadingCircle from './shared/loaders/loading-circle';
import DiffUploadEditContainer from './new/diff-upload/diff-upload-edit-container';
import DiffUploadHeaderEditable from './new/diff-upload/diff-upload-header-editable';
import MessageBanner from './shared/message-banner';
import DiffUploadButton from './new/diff-upload/diff-upload-button';
import Icon from './shared/icon';
import DiffUploadFileInfo from './new/diff-upload/diff-upload-file-info';
import Divider from './shared/divider';
import { FileInfo } from 'types/file-info';
import { captureException } from 'lib/sentry';
import Excel from 'lib/excel';
import type ExcelLoadingTask from 'lib/excel/loading-task';
import dynamic from 'next/dynamic';

const SpreadsheetSvg = dynamic(
  () => import('./shared/icons/excelUploadSpreadsheetIcon.svg'),
  { ssr: false },
) as FC<SVGProps<SVGSVGElement>>;

const EXCEL_FILE_TYPES = {
  'application/vnd.ms-excel': ['.xls', '.xlt', '.xla'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt', '.prn', '.eth'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods', '.fods'],
  'text/spreadsheet': ['.sylk'],
  'application/dbase': ['.dbf'],
  'application/x-dif': ['.dif'],
};

enum ExcelUploadState {
  EMPTY = 'empty',
  ERROR = 'error',
  LOADING = 'loading',
  FILE_LOADED = 'file-loaded',
  THUMBNAIL_LOADED = 'thumbnail-loaded',
}

const getFileType = (extension: string): string | undefined => {
  return Object.entries(EXCEL_FILE_TYPES).find(([_, extensions]) =>
    extensions.includes(extension),
  )?.[0];
};

interface ExcelUploadProps {
  clearState: () => void;
  setId: (id?: number) => void;
  setWorkBook: (workBook?: WorkBook) => void;
  setSheetName: (sheetName: string) => void;
  setFileInfo: (fileInfo: FileInfo) => void;
  filePath?: string;
  initialFilePath?: string;
  headerLineState: {
    value: string;
    setValue: (lineNumber: string) => void;
  };
  selectedSheet: string;
  fileInfo: FileInfo;
  parentFileInfo: FileInfo;
  side: DiffSide;
  workBook?: WorkBook;
  editUploadSettings: boolean;
  showDropzone: boolean;
  openEditSettings: () => void;
  recordingInfo?: RecordingInfo;
  setFilePath: (filePath: string) => void;
  setUploadedPath: (filePath: string) => void;
  setAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
}

const fallbackError = new MessageError({
  type: 'app',
  title: 'Error loading file',
  message: 'Try again to select a file',
});

const passwordProtectedError = new MessageError({
  type: 'app',
  title: 'Password protected file',
  message: 'Please disable password protection and try again',
});

const ExcelUpload = ({
  clearState,
  filePath,
  initialFilePath,
  side,
  setId,
  setWorkBook,
  setSheetName,
  setFileInfo,
  fileInfo,
  parentFileInfo,
  selectedSheet,
  workBook,
  editUploadSettings,
  headerLineState,
  showDropzone,
  openEditSettings,
  recordingInfo,
  setFilePath,
  setUploadedPath,
  setAccessErrorInfo,
}: ExcelUploadProps) => {
  const [error, setError] = useState<MessageError>();
  const [uploadState, setUploadState] = useState<ExcelUploadState>(
    ExcelUploadState.EMPTY,
  );
  const [processedSheet, setProcessedSheet] = useState<string[][]>([]);
  const excelLoadingTask = useRef<ExcelLoadingTask>();
  const [openRecentFileDropdown, setOpenRecentFileDropdown] = useState(false);
  const recentFileDropdownButtonRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback((error?: Error) => {
    setUploadState(ExcelUploadState.ERROR);
    if (error?.message.includes('password-protected')) {
      setError(passwordProtectedError);
    } else {
      setError(fallbackError);
    }
    captureException(error);
  }, []);

  const readFile = useCallback(
    (
      blob: Blob,
      name: string,
      uploadMethod: 'dropzone' | 'diff-input-header' | 'file-path',
    ): void => {
      if (
        recordingInfo?.isRecording &&
        recordingInfo?.isSavingFiles &&
        blob instanceof File
      ) {
        sendFileToBucket(
          blob,
          recordingInfo.sessionId,
          side,
          DiffInputType.EXCEL,
        );
      }

      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result === null) {
          return;
        }
        if (!(reader.result instanceof ArrayBuffer)) {
          return;
        }
        const fileSize = blob.size;
        const fileType = getFileType(name.slice(name.lastIndexOf('.')));

        setUploadState(ExcelUploadState.LOADING);
        const loadingTask = await Excel.handleNewWorkBook(reader.result, {
          fileType,
          onLoad: (workBook: WorkBook, id: number) => {
            const Props = {
              ModifiedDate:
                fileType !==
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  ? (blob as File).lastModified
                  : (workBook.Props as FullProperties).ModifiedDate,
              Size: fileSize,
              Type:
                fileType ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  ? 'application/xlsx'
                  : fileType,
              Name: name,
            };
            workBook.Props = {
              ...(workBook.Props as FullProperties),
              ...Props,
            } as unknown as FullProperties;
            setWorkBook(workBook);
            setSheetName(workBook.SheetNames[0]);
            setFileInfo({ filename: name, fileSize });
            setId(id);
            Tracking.trackEvent('Uploaded file to diff', {
              diffInputType: DiffInputType.EXCEL,
              side,
              ...{ uploadMethod },
            });
            if (
              uploadMethod === 'diff-input-header' ||
              uploadMethod === 'file-path'
            ) {
              setUploadState(ExcelUploadState.FILE_LOADED);
            }
          },
          onError: handleError,
        });
        excelLoadingTask.current = loadingTask;
      };

      reader.onerror = () => {
        handleError();
      };

      reader.readAsArrayBuffer(blob);
    },
    [
      handleError,
      recordingInfo?.isRecording,
      recordingInfo?.isSavingFiles,
      recordingInfo?.sessionId,
      side,
      setFileInfo,
      setSheetName,
      setWorkBook,
      setId,
    ],
  );

  const handleFileUpload = useCallback(
    (
      file: File,
      uploadMethod: 'dropzone' | 'diff-input-header' | 'file-path',
    ): void => {
      if (uploadMethod === 'dropzone') {
        readFile(file, file.name, 'dropzone');
        setFilePath(file.path);
      }

      if (uploadMethod === 'file-path') {
        readFile(file, file.name, 'file-path');
        setFilePath(file.path);
      }

      if (uploadMethod === 'diff-input-header') {
        resetUploadStatus();
        readFile(file, file.name, 'diff-input-header');
        setFilePath(file.path);
      }
    },
    [readFile, setFilePath],
  );

  const resetUploadStatus = useCallback(
    ({ destroyWorker = false }: { destroyWorker?: boolean } = {}) => {
      setError(undefined);
      setUploadState(ExcelUploadState.EMPTY);
      setProcessedSheet([]);
      clearState();
      if (destroyWorker) {
        excelLoadingTask.current?.destroy();
        excelLoadingTask.current = undefined;
      }
    },
    [clearState],
  );

  const handleSheetSelect = (value: string): void => {
    if (value === '' || value === undefined) {
      return;
    }
    setSheetName(value);
  };

  useEffect(() => {
    if (!editUploadSettings && !showDropzone) {
      // when cancelling edit or if user finds difference, we need to reset state
      setUploadState(ExcelUploadState.FILE_LOADED);
    }
  }, [editUploadSettings, showDropzone]);

  useEffect(() => {
    const processThumbnail = async () => {
      // We only want to process the thumbnail if the user is using the dropzone
      if (excelLoadingTask.current && showDropzone) {
        const sheet = await excelLoadingTask.current.processWorkBook(
          workBook,
          selectedSheet,
        );
        setProcessedSheet(sheet);
        setUploadState(ExcelUploadState.THUMBNAIL_LOADED);
      }
    };
    processThumbnail();
    // Add cleanup function
    return () => {
      setProcessedSheet([]);
    };
  }, [workBook, selectedSheet, showDropzone]);

  const uploadFromPath = async (
    filePath: string,
    isFromRecentFile?: boolean,
  ) => {
    setFilePath(filePath);

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

  // TODO: Consider lifting this up to the parent component and only passing in one filepath param to this component.
  // ELECTRON FOLDER AND RECENT DIFFS ONLY - useEffect for loading a file when an initial path is provided.
  useEffect(() => {
    if (initialFilePath) {
      uploadFromPath(initialFilePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount only

  const isDroppable =
    uploadState === ExcelUploadState.EMPTY ||
    uploadState === ExcelUploadState.ERROR;

  return (
    <>
      {showDropzone ? (
        <DiffUploadDropContainer
          isDropzone={
            uploadState === ExcelUploadState.EMPTY ||
            uploadState === ExcelUploadState.ERROR
          }
        >
          {isDroppable && (
            <DiffUploadDropzone
              type={DiffInputType.EXCEL}
              side={side}
              svg={SpreadsheetSvg}
              fileTypeText="excel"
              acceptedFileTypes={EXCEL_FILE_TYPES}
              error={error}
              setError={setError}
              handleFileUpload={(file) => handleFileUpload(file, 'dropzone')}
              handleUploadFromPath={uploadFromPath}
            />
          )}
          {uploadState === ExcelUploadState.LOADING && (
            <>
              <LoadingCircle style="primary" />
              <span>Loading file...</span>
            </>
          )}
          {uploadState === ExcelUploadState.THUMBNAIL_LOADED && (
            <DiffUploadFileViewer
              svg={SpreadsheetSvg}
              filename={fileInfo?.filename}
              fileSize={fileInfo?.fileSize}
              filePath={filePath}
              handleClose={() => {
                resetUploadStatus({ destroyWorker: true });
              }}
            >
              <div className={css.excelViewer}>
                <div className={css.excelViewerThumbnail}>
                  <ExcelThumbnail
                    sheet={processedSheet}
                    selectedHeaderLine={Number(headerLineState.value)}
                  />
                </div>
                <div className={css.excelViewerSettings}>
                  <ExcelSettingsBar
                    handleSheetSelect={handleSheetSelect}
                    workBook={workBook}
                    selectedSheet={selectedSheet}
                    headerLineState={headerLineState}
                    dropdownDirection="up"
                  />
                </div>
              </div>
            </DiffUploadFileViewer>
          )}
        </DiffUploadDropContainer>
      ) : editUploadSettings ? (
        <DiffUploadEditContainer>
          {uploadState === ExcelUploadState.ERROR && (
            <div className={css.editError}>
              <MessageBanner
                error={error || fallbackError}
                size="small"
                centered
              />
              <DiffUploadButton
                label={`${side} spreadsheet`}
                acceptedFileTypes={Object.values(EXCEL_FILE_TYPES).flat()}
                side={side}
                type={DiffInputType.EXCEL}
                handleFileUpload={(file) =>
                  handleFileUpload(file, 'diff-input-header')
                }
                fullWidth
                style="secondary"
                tone="base"
              />
            </div>
          )}
          {uploadState === ExcelUploadState.FILE_LOADED && (
            <div className={css.editContainer}>
              <Icon size="xl" svg={SpreadsheetSvg} className={css.icon} />
              <div className={css.editContent}>
                <DiffUploadFileInfo
                  filename={fileInfo.filename}
                  fileSize={fileInfo.fileSize}
                  filePath={filePath}
                >
                  {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                    <RecentFilesDropdownButton
                      diffType={DiffInputType.EXCEL}
                      openDropdown={openRecentFileDropdown}
                      setOpenDropdown={setOpenRecentFileDropdown}
                      buttonRef={recentFileDropdownButtonRef}
                    />
                  )}
                  <DiffUploadButton
                    label={fileInfo.filename}
                    acceptedFileTypes={Object.values(EXCEL_FILE_TYPES).flat()}
                    side={side}
                    type={DiffInputType.EXCEL}
                    handleFileUpload={(file) =>
                      handleFileUpload(file, 'diff-input-header')
                    }
                    style="secondary"
                    tone="base"
                  />
                </DiffUploadFileInfo>
                <Divider />
                {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                  <RecentFilesDropdownMenu
                    isOpen={openRecentFileDropdown}
                    diffType={DiffInputType.EXCEL}
                    onItemClick={(recentFile) => {
                      uploadFromPath(recentFile.filePath, true);
                    }}
                    setOpen={setOpenRecentFileDropdown}
                    buttonRef={recentFileDropdownButtonRef}
                    variant="editHeader"
                  />
                )}
                <ExcelSettingsBar
                  handleSheetSelect={handleSheetSelect}
                  workBook={workBook}
                  selectedSheet={selectedSheet}
                  headerLineState={headerLineState}
                  dropdownDirection="down"
                />
              </div>
            </div>
          )}
          {uploadState === ExcelUploadState.LOADING && (
            <>
              <LoadingCircle size="default" style="primary" />
              <span>Loading file...</span>
            </>
          )}
        </DiffUploadEditContainer>
      ) : (
        <DiffUploadHeaderEditable
          type={DiffInputType.EXCEL}
          side={side}
          svg={SpreadsheetSvg}
          acceptedFileTypes={Object.values(EXCEL_FILE_TYPES).flat()}
          handleFileUpload={(file) => {
            openEditSettings();
            handleFileUpload(file, 'diff-input-header');
          }}
          filename={parentFileInfo.filename}
          handleEdit={openEditSettings}
        />
      )}
    </>
  );
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

export default ExcelUpload;
