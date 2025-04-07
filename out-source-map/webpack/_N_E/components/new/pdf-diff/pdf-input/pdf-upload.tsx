import { FileInfo } from 'types/file-info';
import { PageRange } from 'types/page-range';
import PDFiumDocument from 'lib/pdfium/document';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DiffSide } from 'types/diffSide';
import MessageError from 'types/message-error';
import DiffUploadDropContainer from '../../diff-upload/diff-upload-drop-container';
import DiffUploadDropzone from '../../diff-upload/diff-upload-dropzone';
import { DiffInputType } from 'types/diff-input-type';
import DocumentSvg from 'components/shared/icons/document.svg';
import LockSvg from 'components/shared/icons/lock.svg';
import PDFiumLoadingTask from 'lib/pdfium/loading-task';
import css from './pdf-upload.module.css';
import DiffUploadFileViewer from 'components/new/diff-upload/diff-upload-file-viewer';
import PdfThumbnail from './pdf-thumbnail';
import PdfRangePicker from './pdf-range-picker';
import PdfPassword from './pdf-password';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import { InvalidPDFException } from 'lib/pdfium/exceptions';
import DiffUploadHeaderEditable from 'components/new/diff-upload/diff-upload-header-editable';
import DiffUploadEditContainer from 'components/new/diff-upload/diff-upload-edit-container';
import DiffUploadFileInfo from 'components/new/diff-upload/diff-upload-file-info';
import DiffUploadButton from 'components/new/diff-upload/diff-upload-button';
import Divider from 'components/shared/divider';
import DiffUploadPassword from 'components/new/diff-upload/diff-upload-password';
import cx from 'classnames';
import MessageBanner from 'components/shared/message-banner';
import Icon from 'components/shared/icon';
import PDFium from 'lib/pdfium';
import WordThumbnailGenerateTask, {
  ThumbnailGenerateResult,
} from 'lib/convert/pdf/util/word-thumbnail-generate-task';
import { WordDocumentInfo } from 'types/word-doc-info';
import Tracking from 'lib/tracking';
import InvalidUploadModal from 'components/new/invalid-upload-modal';
import mimeTypeToDiffType from 'lib/mime-type-to-diff-type';
import { FileSizeError, TimeoutError } from 'types/conversion-errors';
import { captureException } from 'lib/sentry';
import { sendFileToBucket } from 'lib/s3-bucket';
import { RecordingInfo } from 'types/recordingInfo';
import { RawDocument, ThumbnailMeta } from 'lib/hooks/use-diff-document';
import { calculateHash } from 'lib/calculate-buffer-hash';
import { AccessErrorInfo } from 'components/file-access-error-modal';
import path from 'path';
import dynamic from 'next/dynamic';

const PDF_FILE_TYPE = 'application/pdf';
const ACCEPTED_REDIRECT_FILE_TYPES = {
  'text/plain': ['.txt'],
  'text/html': ['.html', '.htm'],
  'application/xml': ['.xml'],
};
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    '.pptx',
  ],
  ...ACCEPTED_REDIRECT_FILE_TYPES,
};

const FILE_EXTENSIONS_TO_MIME_TYPES = Object.entries(
  ACCEPTED_FILE_TYPES,
).reduce(
  (acc, [mimeType, extensions]) => {
    extensions.forEach((extension) => {
      acc[extension] = mimeType;
    });
    return acc;
  },
  {} as Record<string, string>,
);

enum PdfUploadState {
  EMPTY = 'empty',
  ERROR = 'error',
  LOADING_READING = 'loading-reading',
  LOADING_THUMBNAIL = 'loading-thumbnail',
  LOADING_PARSING = 'loading-parsing',
  PASSWORD_REQUIRED = 'password-required',
  PASSWORD_CHECKING = 'password-checking',
  PASSWORD_INCORRECT = 'password-incorrect',
  FILE_LOADED = 'file-loaded',
}

const pdfLoadingText: Record<
  | PdfUploadState.LOADING_READING
  | PdfUploadState.LOADING_THUMBNAIL
  | PdfUploadState.LOADING_PARSING,
  string
> = {
  [PdfUploadState.LOADING_READING]: 'Loading file...',
  [PdfUploadState.LOADING_THUMBNAIL]: 'Generating thumbnail...',
  [PdfUploadState.LOADING_PARSING]: 'Reading file...',
};

const isLoadingState = (
  state: string,
): state is
  | PdfUploadState.LOADING_READING
  | PdfUploadState.LOADING_THUMBNAIL
  | PdfUploadState.LOADING_PARSING => {
  return (
    state === PdfUploadState.LOADING_READING ||
    state === PdfUploadState.LOADING_THUMBNAIL ||
    state === PdfUploadState.LOADING_PARSING
  );
};

const isPasswordState = (
  state: string,
): state is
  | PdfUploadState.PASSWORD_REQUIRED
  | PdfUploadState.PASSWORD_CHECKING
  | PdfUploadState.PASSWORD_INCORRECT => {
  return (
    state === PdfUploadState.PASSWORD_REQUIRED ||
    state === PdfUploadState.PASSWORD_CHECKING ||
    state === PdfUploadState.PASSWORD_INCORRECT
  );
};

const fallbackError: MessageError = new MessageError({
  type: 'app',
  title: 'Error loading file',
  message: 'Try again to select a file',
});

interface PdfUploadProps {
  side: DiffSide;
  showDropzone: boolean;
  isEditing: boolean;
  setIsEditing: (set: boolean) => void;
  document?: PDFiumDocument;
  pageRange: PageRange;
  setDocument: (document: PDFiumDocument) => void;
  setPageRange: (pageRange: PageRange) => void;
  closeDocument: () => void;
  initialFilePath?: string;
  recordingInfo?: RecordingInfo;
  rawDocument?: RawDocument;
  setRawDocument: (rawDocument: RawDocument | undefined) => void;
  setIsReadyToBeDiffed: (isReadyToBeDiffed: boolean) => void;
  thumbnailMeta?: ThumbnailMeta;
  setThumbnailMeta: (thumbnailMeta: ThumbnailMeta | undefined) => void;
  isAnyOutputTypeLoading: boolean;
  setAccessErrorInfo: (accessErrorInfo: AccessErrorInfo) => void;
  setUploadedPath: (filePath: string) => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({
  side,
  showDropzone,
  isEditing,
  setIsEditing,
  document,
  setDocument,
  pageRange,
  setPageRange,
  closeDocument,
  initialFilePath,
  recordingInfo,
  rawDocument,
  setRawDocument,
  setIsReadyToBeDiffed,
  thumbnailMeta,
  setThumbnailMeta,
  isAnyOutputTypeLoading,
  setAccessErrorInfo,
  setUploadedPath,
}) => {
  const [uploadState, setUploadState] = useState<PdfUploadState>(
    PdfUploadState.EMPTY,
  );
  const [error, setError] = useState<MessageError>();
  const PDFiumLoadingTaskRef = useRef<PDFiumLoadingTask>();
  const wordThumbnailGenerateTaskRef = useRef<WordThumbnailGenerateTask>();
  const [preferredDiffType, setPreferredDiffType] = useState(DiffInputType.PDF);
  const [openRecentFileDropdown, setOpenRecentFileDropdown] = useState(false);

  useEffect(() => {
    if (!showDropzone && !isEditing) {
      // when cancelling edit, it could happen during load/error/password, so we need to reset state
      setUploadState(PdfUploadState.FILE_LOADED);
      setError(undefined);
      PDFiumLoadingTaskRef.current?.destroy();
      PDFiumLoadingTaskRef.current = undefined;
      wordThumbnailGenerateTaskRef.current?.destroy();
      wordThumbnailGenerateTaskRef.current = undefined;
    }
  }, [isEditing, showDropzone]);

  const handleError = useCallback((error?: Error) => {
    PDFiumLoadingTaskRef.current?.destroy();
    PDFiumLoadingTaskRef.current = undefined;
    wordThumbnailGenerateTaskRef.current?.destroy();
    wordThumbnailGenerateTaskRef.current = undefined;

    setUploadState(PdfUploadState.ERROR);
    if (error instanceof InvalidPDFException) {
      setError(
        new MessageError({
          type: 'user',
          title: 'Invalid document format',
          message: 'Please try a different file',
        }),
      );
    } else if (
      error instanceof TimeoutError ||
      error instanceof FileSizeError
    ) {
      const type = error instanceof TimeoutError ? 'app' : 'user';
      setError(
        new MessageError({
          type,
          title: error.name,
          message: error.message,
        }),
      );
    } else {
      setError(fallbackError);
      captureException(error);
    }
  }, []);

  const handlePdfPassword = useCallback((firstTry: boolean) => {
    if (firstTry) {
      setUploadState(PdfUploadState.PASSWORD_REQUIRED);
    } else {
      setUploadState(PdfUploadState.PASSWORD_INCORRECT);
    }
  }, []);

  const checkIfPreferredDiffType = useCallback((mimeType: string): boolean => {
    const preferredDiffType = mimeTypeToDiffType(mimeType) ?? DiffInputType.PDF;
    setPreferredDiffType(preferredDiffType);
    return preferredDiffType === DiffInputType.PDF; // return true if the file is allowed to be diffed
  }, []);

  const handleFileUpload = useCallback(
    (
      file: File,
      uploadMethod: 'dropzone' | 'result-header' | 'edit-menu' | 'file-path',
    ) => {
      if (!checkIfPreferredDiffType(file.type)) {
        return;
      }

      if (recordingInfo?.isRecording && recordingInfo?.isSavingFiles) {
        sendFileToBucket(
          file,
          recordingInfo.sessionId,
          side,
          DiffInputType.PDF,
        );
      }

      closeDocument();

      const fileInfo: FileInfo = {
        filename: file.name,
        fileSize: file.size,
        filePath: file.path,
      };

      const reader = new FileReader();

      reader.onerror = () => handleError();

      reader.onloadstart = () => {
        setUploadState(PdfUploadState.LOADING_READING);
      };

      reader.onload = async () => {
        Tracking.trackEvent('Uploaded file to diff', {
          diffInputType: DiffInputType.PDF,
          side,
          uploadMethod,
        });

        const result = reader.result as ArrayBuffer;

        const wordDocumentInfo: WordDocumentInfo | undefined =
          file.type !== PDF_FILE_TYPE
            ? {
                data: result,
                fileName: file.name,
                fileType: file.type,
                filePath: file.path,
              }
            : undefined;

        // TODO consider setting raw document again after docx password decryption.
        //      For now it's working b/c side effects, but this feels sketchy and prone to bugs
        setRawDocument({ fileInfo, wordDocumentInfo });

        /**
         * If user uploads pdf file we can do PDFium load right away
         */
        if (file.type === PDF_FILE_TYPE) {
          setUploadState(PdfUploadState.LOADING_PARSING);
          PDFiumLoadingTaskRef.current?.destroy();

          const hash = await calculateHash(result);
          const loadingTask = await PDFium.loadDocument(result, {
            fileInfo,
            hash,
            onPassword: handlePdfPassword,
            onLoad: (pdf) => {
              PDFiumLoadingTaskRef.current = undefined;
              setUploadState(PdfUploadState.FILE_LOADED);
              setThumbnailMeta({ document: pdf });
              setDocument(pdf);
              setPageRange({ from: 1, to: pdf.pageCount });

              // TODO we can technically set this earlier right after the password is handled,
              //      but because pdfium loading is already so fast, this will do for now.
              setIsReadyToBeDiffed(true);
            },
            onError: handleError,
          });
          PDFiumLoadingTaskRef.current = loadingTask;
          return;
        }

        /**
         * If user uploads docx file, we attempt to just get a thumbnail instead of doing a full pdf load.
         * The docx file is converted to a full pdf in a later step
         *
         * (A thumbnail can either be a url or a 1 page pdf depending on the platform)
         */
        if (!wordDocumentInfo) {
          throw new Error(
            'Word document info not available (this should not happen)',
          );
        }

        setUploadState(PdfUploadState.LOADING_THUMBNAIL);
        wordThumbnailGenerateTaskRef.current = new WordThumbnailGenerateTask(
          wordDocumentInfo,
          {
            onPassword: handlePdfPassword,
            onLoadStart: () => {
              // docx is ready to be diffed after password is properly handled
              setIsReadyToBeDiffed(true);
              setUploadState(PdfUploadState.LOADING_THUMBNAIL);
            },
            onLoad: async (result: ThumbnailGenerateResult) => {
              if (result.thumbnailRawDocument) {
                // Thumbnail is a 1 page pdf, do PDFium load
                setUploadState(PdfUploadState.LOADING_PARSING);
                const { data, wordDocumentInfo } = result.thumbnailRawDocument;

                PDFiumLoadingTaskRef.current?.destroy();
                const hash = await calculateHash(data);
                const loadingTask = await PDFium.loadDocument(data, {
                  wordDocumentInfo,
                  fileInfo,
                  hash,
                  onPassword: handlePdfPassword,
                  onLoad: (pdf) => {
                    // we don't set document here since the converted pdf is only 1 page
                    // full conversion happens when user clicks diff button
                    PDFiumLoadingTaskRef.current = undefined;
                    setUploadState(PdfUploadState.FILE_LOADED);
                    setThumbnailMeta({ document: pdf });
                    setPageRange({
                      from: 1,
                      to: wordDocumentInfo.pageCount ?? -1,
                    });
                  },
                  onError: handleError,
                });
                PDFiumLoadingTaskRef.current = loadingTask;
              } else if (result.thumbnailUrl) {
                // Thumbnail is a url, simply set state
                setThumbnailMeta({ url: result.thumbnailUrl });
                setUploadState(PdfUploadState.FILE_LOADED);
              } else {
                throw new Error('No thumbnail metadata available');
              }
            },
            onError: handleError,
          },
        );
      };

      reader.readAsArrayBuffer(file);

      if (!showDropzone) {
        setIsEditing(true);
      }
    },
    [
      checkIfPreferredDiffType,
      recordingInfo?.isRecording,
      recordingInfo?.isSavingFiles,
      recordingInfo?.sessionId,
      closeDocument,
      showDropzone,
      side,
      handleError,
      setRawDocument,
      handlePdfPassword,
      setThumbnailMeta,
      setDocument,
      setPageRange,
      setIsReadyToBeDiffed,
      setIsEditing,
    ],
  );

  const uploadFromPath = async (
    filePath: string,
    isFromRecentFile?: boolean,
  ) => {
    const fileExtension = path.extname(filePath);
    const mimeType = fileExtension
      ? FILE_EXTENSIONS_TO_MIME_TYPES[fileExtension]
      : undefined;

    const { fetchLocalFile } = await import('lib/fetch-local-file');
    const response = await fetchLocalFile({
      path: filePath,
      type: mimeType,
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

  // ELECTRON FOLDER AND RECENT DIFFS ONLY - useEffect for loading a file when an initial path is provided.
  useEffect(() => {
    if (initialFilePath) {
      uploadFromPath(initialFilePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // on mount only

  const isDroppable =
    uploadState === PdfUploadState.EMPTY ||
    uploadState === PdfUploadState.ERROR;

  const pageCount =
    rawDocument?.wordDocumentInfo?.pageCount ?? document?.pageCount;

  const fileInfo: FileInfo = rawDocument?.fileInfo ?? { filename: '' };

  const dropdownButtonRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {showDropzone ? ( // INITIAL UPLOAD -- DROPZONE
        <DiffUploadDropContainer isDropzone={isDroppable}>
          {isDroppable && (
            <DiffUploadDropzone
              type={DiffInputType.PDF}
              side={side}
              svg={DocumentSvg}
              fileTypeText="document"
              acceptedFileTypes={ACCEPTED_FILE_TYPES}
              handleFileUpload={(file) => handleFileUpload(file, 'dropzone')}
              handleUploadFromPath={uploadFromPath}
              error={error}
              setError={setError}
              onFileRejected={checkIfPreferredDiffType}
            />
          )}
          {uploadState === PdfUploadState.FILE_LOADED && (
            <DiffUploadFileViewer
              svg={DocumentSvg}
              filename={fileInfo.filename}
              filePath={fileInfo.filePath}
              fileSize={fileInfo.fileSize}
              handleClose={() => {
                document?.destroy();
                closeDocument();
                setIsReadyToBeDiffed(false);
                setUploadState(PdfUploadState.EMPTY);
              }}
            >
              <div className={css.fileViewer}>
                <div className={css.fileViewerThumbnail}>
                  <PdfThumbnail
                    document={document ?? thumbnailMeta?.document}
                    url={thumbnailMeta?.url}
                    isEditing={isEditing}
                  />
                </div>
                {pageCount && pageCount > 0 && (
                  <div className={css.fileViewerPageRange}>
                    <PdfRangePicker
                      side={side}
                      pageCount={pageCount}
                      pageRange={
                        pageRange.to > 0
                          ? pageRange
                          : { from: 1, to: pageCount }
                      }
                      setPageRange={setPageRange}
                    />
                  </div>
                )}
              </div>
            </DiffUploadFileViewer>
          )}
          {isLoadingState(uploadState) && (
            <DiffUploadFileViewer
              svg={DocumentSvg}
              filename={fileInfo.filename}
              filePath={fileInfo.filePath}
              fileSize={fileInfo.fileSize}
              handleClose={() => {
                PDFiumLoadingTaskRef.current?.destroy();
                wordThumbnailGenerateTaskRef.current?.destroy();
                setIsReadyToBeDiffed(false);
                setUploadState(PdfUploadState.EMPTY);
                setThumbnailMeta(undefined);
              }}
            >
              <div className={css.loadingContainer}>
                <LoadingCircle style="primary" />
                <span>{pdfLoadingText[uploadState]}</span>
              </div>
            </DiffUploadFileViewer>
          )}
          {isPasswordState(uploadState) && (
            <DiffUploadFileViewer
              svg={DocumentSvg}
              filename={fileInfo.filename}
              filePath={fileInfo.filePath}
              fileSize={fileInfo.fileSize}
              handleClose={() => {
                PDFiumLoadingTaskRef.current?.destroy();
                wordThumbnailGenerateTaskRef.current?.destroy();
                setUploadState(PdfUploadState.EMPTY);
                setThumbnailMeta(undefined);
                setIsReadyToBeDiffed(false);
              }}
              disableClose={uploadState === PdfUploadState.PASSWORD_CHECKING}
            >
              <PdfPassword
                handleSubmitPassword={(password: string) => {
                  setUploadState(PdfUploadState.PASSWORD_CHECKING);
                  PDFiumLoadingTaskRef.current?.updatePassword(password);
                  wordThumbnailGenerateTaskRef.current?.updatePassword(
                    password,
                  );
                }}
                isLoading={uploadState === PdfUploadState.PASSWORD_CHECKING}
                isIncorrect={uploadState === PdfUploadState.PASSWORD_INCORRECT}
              />
            </DiffUploadFileViewer>
          )}
        </DiffUploadDropContainer>
      ) : isEditing ? ( // RESULT HEADER -- EDIT MENU
        <DiffUploadEditContainer>
          {uploadState === PdfUploadState.ERROR && (
            <div className={css.editError}>
              <MessageBanner
                error={error || fallbackError}
                size="small"
                centered
              />
              <DiffUploadButton
                label={`${side} document`}
                acceptedFileTypes={Object.values(ACCEPTED_FILE_TYPES).flat()}
                side={side}
                type={DiffInputType.PDF}
                handleFileUpload={(file) => handleFileUpload(file, 'edit-menu')}
                style="secondary"
                tone="base"
                fullWidth
                disabled={isAnyOutputTypeLoading}
              />
            </div>
          )}
          {(uploadState === PdfUploadState.FILE_LOADED ||
            isPasswordState(uploadState)) && (
            <div className={css.editContainer}>
              <div className={css.editThumbnail}>
                {isPasswordState(uploadState) ? (
                  <div
                    className={cx(css.lock, {
                      [css.passwordIncorrect]:
                        uploadState === PdfUploadState.PASSWORD_INCORRECT,
                    })}
                  >
                    <Icon svg={LockSvg} size="xl" />
                  </div>
                ) : (
                  <PdfThumbnail
                    document={document ?? thumbnailMeta?.document}
                    url={thumbnailMeta?.url}
                    isEditing={isEditing}
                  />
                )}
              </div>
              <div className={css.editContent}>
                <DiffUploadFileInfo
                  filename={fileInfo.filename}
                  fileSize={fileInfo.fileSize}
                  filePath={fileInfo.filePath}
                >
                  {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                    <RecentFilesDropdownButton
                      diffType={DiffInputType.PDF}
                      openDropdown={openRecentFileDropdown}
                      setOpenDropdown={setOpenRecentFileDropdown}
                      buttonRef={dropdownButtonRef}
                    />
                  )}
                  <DiffUploadButton
                    label={`${side} document`}
                    acceptedFileTypes={Object.values(
                      ACCEPTED_FILE_TYPES,
                    ).flat()}
                    side={side}
                    type={DiffInputType.PDF}
                    handleFileUpload={(file) =>
                      handleFileUpload(file, 'edit-menu')
                    }
                    style="secondary"
                    tone="base"
                    disabled={isAnyOutputTypeLoading}
                  />
                </DiffUploadFileInfo>
                <Divider />
                {process.env.NEXT_PUBLIC_IS_ELECTRON && (
                  <RecentFilesDropdownMenu
                    isOpen={openRecentFileDropdown}
                    diffType={DiffInputType.PDF}
                    onItemClick={(recentFile) => {
                      uploadFromPath(recentFile.filePath, true);
                    }}
                    setOpen={setOpenRecentFileDropdown}
                    buttonRef={dropdownButtonRef}
                    variant="editHeader"
                  />
                )}
                {isPasswordState(uploadState) ? (
                  <DiffUploadPassword
                    size="small"
                    handleSubmitPassword={(password: string) => {
                      setUploadState(PdfUploadState.PASSWORD_CHECKING);
                      PDFiumLoadingTaskRef.current?.updatePassword(password);
                      wordThumbnailGenerateTaskRef.current?.updatePassword(
                        password,
                      );
                    }}
                    isLoading={uploadState === PdfUploadState.PASSWORD_CHECKING}
                    isIncorrect={
                      uploadState === PdfUploadState.PASSWORD_INCORRECT
                    }
                  />
                ) : (
                  pageCount &&
                  pageCount > 0 && (
                    <PdfRangePicker
                      size="small"
                      side={side}
                      pageCount={pageCount}
                      pageRange={
                        pageRange.to > 0
                          ? pageRange
                          : { from: 1, to: pageCount }
                      }
                      setPageRange={setPageRange}
                    />
                  )
                )}
              </div>
            </div>
          )}
          {isLoadingState(uploadState) && (
            <>
              <LoadingCircle style="primary" />
              <span>{pdfLoadingText[uploadState]}</span>
            </>
          )}
        </DiffUploadEditContainer>
      ) : (
        // RESULT HEADER -- NO EDITING
        <DiffUploadHeaderEditable
          type={DiffInputType.PDF}
          side={side}
          svg={DocumentSvg}
          acceptedFileTypes={Object.values(ACCEPTED_FILE_TYPES).flat()}
          handleFileUpload={(file) => handleFileUpload(file, 'result-header')}
          filename={fileInfo.filename}
          handleEdit={() => setIsEditing(true)}
          text={
            pageRange.to > 0
              ? `Pages ${pageRange.from} to ${pageRange.to}`
              : pageCount !== undefined
                ? `Pages 1 to ${pageCount}`
                : ''
          }
          disabled={isAnyOutputTypeLoading}
        />
      )}
      <InvalidUploadModal
        isOpen={preferredDiffType !== DiffInputType.PDF}
        closeModal={() => {
          setPreferredDiffType(DiffInputType.PDF);
        }}
        preferredDiffType={preferredDiffType}
        currentDiffType={DiffInputType.PDF}
        showNonRedirectError={false}
      />
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

export default PdfUpload;
