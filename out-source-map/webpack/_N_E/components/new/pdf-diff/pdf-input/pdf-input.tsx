import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  PdfDocumentState,
  UsePdfDocumentReturn,
} from 'lib/hooks/use-diff-document';
import PdfUpload from './pdf-upload';
import css from './pdf-input.module.css';
import cx from 'classnames';
import Button from 'components/shared/button';
import IconButton from 'components/shared/icon-button';
import SwitchSvg from 'components/shared/icons/switch.svg';
import { RecordingInfo } from 'types/recordingInfo';
import PDFium from 'lib/pdfium';
import { DiffInputType } from 'types/diff-input-type';
import Tracking from 'lib/tracking';
import {
  DiffTypeDropdownOutputType,
  PdfDiffOutputTypes,
} from 'lib/output-types';
import ipcEvents from 'ipc-events';
import getOs from 'lib/get-os';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import Modal from 'components/shared/modal';
import PdfInputSettings from './pdf-input-settings';
import React from 'react';
import dynamic from 'next/dynamic';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { AccessErrorInfo } from 'components/file-access-error-modal';
import { DiffDropdown } from 'components/diff-dropdown';
import { t } from 'lib/react-tiny-i18n';

const pdfDropdownOutputTypes: DiffTypeDropdownOutputType<PdfDiffOutputTypes>[] =
  [
    {
      label: PdfDiffOutputTypes.RichText,
      value: PdfDiffOutputTypes.RichText,
      description:
        'Mark changes on both documents separately without changing them',
      image: dynamic(() => import('static/images/new/dropdown-rich-text.svg'), {
        ssr: false,
      }) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
    {
      label: PdfDiffOutputTypes.Text,
      value: PdfDiffOutputTypes.Text,
      description: 'Compare the contents of both documents as plain text',
      image: dynamic(
        () => import('static/images/new/dropdown-plain-text.svg'),
        {
          ssr: false,
        },
      ) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
    {
      label: PdfDiffOutputTypes.Image,
      value: PdfDiffOutputTypes.Image,
      description: 'Compare the visual differences of both documents',
      image: dynamic(() => import('static/images/new/dropdown-image.svg'), {
        ssr: false,
      }) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
    {
      label: PdfDiffOutputTypes.OCR,
      value: PdfDiffOutputTypes.OCR,
      description:
        'Transform scanned documents and other images into text comparison',
      image: dynamic(() => import('static/images/new/dropdown-ocr.svg'), {
        ssr: false,
      }) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
    {
      label: PdfDiffOutputTypes['File details'],
      value: PdfDiffOutputTypes['File details'],
    },
  ];

const redlineOutputType: DiffTypeDropdownOutputType<PdfDiffOutputTypes> = {
  label: PdfDiffOutputTypes.Redline,
  value: PdfDiffOutputTypes.Redline,
  description: 'Compile documents into single version with marked changes',
  image: dynamic(() => import('static/images/new/dropdown-redline.svg'), {
    ssr: false,
  }) as React.FC<React.SVGProps<SVGSVGElement>>,
};

interface PdfInputProps {
  outputType: PdfDiffOutputTypes;
  setOutputType: Dispatch<SetStateAction<PdfDiffOutputTypes>>;
  showDropzone: boolean;
  isAnyOutputTypeLoading: boolean;
  leftState: PdfDocumentState;
  rightState: PdfDocumentState;
  initialLeftPath?: string;
  initialRightPath?: string;
  recordingInfo?: RecordingInfo;
  handleComputeDiffClick: (
    leftState: PdfDocumentState,
    rightState: PdfDocumentState,
  ) => void;
  tempLeftDocumentManager: UsePdfDocumentReturn;
  tempRightDocumentManager: UsePdfDocumentReturn;
  redlinePDFiumDocId?: number;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  diffOrigin?: string;
}

const PdfInput: React.FC<PdfInputProps> = ({
  outputType,
  setOutputType,
  showDropzone,
  isAnyOutputTypeLoading,
  leftState: parentLeftState,
  rightState: parentRightState,
  initialLeftPath,
  initialRightPath,
  recordingInfo,
  handleComputeDiffClick,
  tempLeftDocumentManager,
  tempRightDocumentManager,
  redlinePDFiumDocId,
  isEditing,
  setIsEditing,
  diffOrigin,
}) => {
  const {
    document: leftDocument,
    setDocument: setLeftDocument,
    pageRange: leftPageRange,
    setPageRange: setLeftPageRange,
    state: leftState,
    setState: setLeftState,
    clearState: clearLeftState,
    rawDocument: leftRawDocument,
    setRawDocument: setLeftRawDocument,
    thumbnailMeta: leftThumbnailMeta,
    setThumbnailMeta: setLeftThumbnailMeta,
  } = tempLeftDocumentManager;
  const {
    document: rightDocument,
    setDocument: setRightDocument,
    pageRange: rightPageRange,
    setPageRange: setRightPageRange,
    state: rightState,
    setState: setRightState,
    clearState: clearRightState,
    rawDocument: rightRawDocument,
    setRawDocument: setRightRawDocument,
    thumbnailMeta: rightThumbnailMeta,
    setThumbnailMeta: setRightThumbnailMeta,
  } = tempRightDocumentManager;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [leftIsReadyToBeDiffed, setLeftIsReadyToBeDiffed] = useState(false);
  const [rightIsReadyToBeDiffed, setRightIsReadyToBeDiffed] = useState(false);
  const [inputSettingsModalOpen, setInputSettingsModalOpen] = useState(false);

  // these are only for error handling
  const [leftUploadedPath, setLeftUploadedPath] = useState<string>('');
  const [rightUploadedPath, setRightUploadedPath] = useState<string>('');

  const [leftAccessErrorInfo, setLeftAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);
  const [rightAccessErrorInfo, setRightAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);

  const isPro = useAppSelector(isProUser);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_IS_ELECTRON &&
      !pdfDropdownOutputTypes.includes(redlineOutputType) &&
      (getOs() === 'windows' || getOs() === 'mac')
    ) {
      pdfDropdownOutputTypes.splice(
        getOs() === 'windows' ? 1 : 2,
        0,
        redlineOutputType,
      );
    }
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      window.ipcRenderer.send(
        ipcEvents.APP__PDF_INPUT_VISIBILITY_CHANGED,
        isEditing,
      );
    }
  }, [isEditing]);

  const findDifference = useCallback(
    async (leftState: PdfDocumentState, rightState: PdfDocumentState) => {
      // Close any existing redline word process and notify if the diff type is redline
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.ipcRenderer.send(ipcEvents.APP__REDLINE_CLOSE_WORD_PROCESS);
        window.ipcRenderer.send(
          ipcEvents.APP__REDLINE_DIFF_TYPE_SELECTED,
          outputType === PdfDiffOutputTypes.Redline,
        );
      }

      PDFium.destroyDocumentsExcept(
        leftState.document?.id,
        rightState.document?.id,
      );

      handleComputeDiffClick(leftState, rightState);
      Tracking.trackEvent('Created diff', { diffType: DiffInputType.PDF });
    },
    [handleComputeDiffClick, outputType],
  );

  const cancelEdit = useCallback(() => {
    PDFium.destroyDocumentsExcept(
      parentLeftState.document?.id,
      parentRightState.document?.id,

      // note that it's important we don't accidentally destroy redline PDFium doc
      // (if it exists) when cancelling.
      redlinePDFiumDocId,
    );

    /**
     * Reset local state to match parent state
     */
    setLeftState(parentLeftState);
    setRightState(parentRightState);
    setIsEditing(false);
  }, [
    parentLeftState,
    parentRightState,
    redlinePDFiumDocId,
    setLeftState,
    setRightState,
  ]);

  const swap = useCallback(() => {
    const temp = leftState;
    setLeftState(rightState);
    setRightState(temp);

    if (!isEditing) {
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.ipcRenderer.send(ipcEvents.APP__REDLINE_CLOSE_WORD_PROCESS);
      }
      PDFium.destroyDocumentsExcept(
        leftState.document?.id,
        rightState.document?.id,
      );
      handleComputeDiffClick(rightState, temp);
    }
  }, [
    isEditing,
    leftState,
    rightState,
    setLeftState,
    setRightState,
    handleComputeDiffClick,
  ]);

  const isEditFilesSameAsParent =
    isEditing &&
    // Compare file paths if they exist
    ((leftRawDocument?.fileInfo.filePath &&
      rightRawDocument?.fileInfo.filePath &&
      leftRawDocument.fileInfo.filePath ===
        parentLeftState.rawDocument?.fileInfo.filePath &&
      rightRawDocument.fileInfo.filePath ===
        parentRightState.rawDocument?.fileInfo.filePath) ||
      // Fall back to comparing filenames
      (leftRawDocument?.fileInfo.filename ===
        parentLeftState.rawDocument?.fileInfo.filename &&
        rightRawDocument?.fileInfo.filename ===
          parentRightState.rawDocument?.fileInfo.filename));

  const isEditPageRangeSameAsParent =
    isEditing &&
    leftState.pageRange.from === parentLeftState.pageRange.from &&
    leftState.pageRange.to === parentLeftState.pageRange.to &&
    rightState.pageRange.from === parentRightState.pageRange.from &&
    rightState.pageRange.to === parentRightState.pageRange.to;

  return (
    <>
      <div
        className={cx(css.inputContainer, {
          [css.dropzone]: showDropzone,
          [css.closedHeader]: !showDropzone && !isEditing,
          [css.editingHeader]: !showDropzone && isEditing,
        })}
      >
        <div className={css.uploadContainer}>
          <PdfUpload
            side="left"
            showDropzone={showDropzone}
            document={leftDocument}
            pageRange={leftPageRange}
            setDocument={setLeftDocument}
            setPageRange={setLeftPageRange}
            closeDocument={clearLeftState}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            initialFilePath={initialLeftPath}
            recordingInfo={recordingInfo}
            rawDocument={leftRawDocument}
            setRawDocument={setLeftRawDocument}
            setIsReadyToBeDiffed={setLeftIsReadyToBeDiffed}
            thumbnailMeta={leftThumbnailMeta}
            setThumbnailMeta={setLeftThumbnailMeta}
            isAnyOutputTypeLoading={isAnyOutputTypeLoading}
            setAccessErrorInfo={setLeftAccessErrorInfo}
            setUploadedPath={setLeftUploadedPath}
          />
          {!showDropzone && (
            <IconButton
              size="small"
              style="text"
              tone="base"
              svg={SwitchSvg}
              onClick={swap}
              aria-label="Swap diffs"
              disabled={
                !leftIsReadyToBeDiffed ||
                !rightIsReadyToBeDiffed ||
                isAnyOutputTypeLoading
              }
              className={css.swapButton}
            />
          )}
          <PdfUpload
            side="right"
            showDropzone={showDropzone}
            document={rightDocument}
            pageRange={rightPageRange}
            setDocument={setRightDocument}
            setPageRange={setRightPageRange}
            closeDocument={clearRightState}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            initialFilePath={initialRightPath}
            recordingInfo={recordingInfo}
            rawDocument={rightRawDocument}
            setRawDocument={setRightRawDocument}
            setIsReadyToBeDiffed={setRightIsReadyToBeDiffed}
            thumbnailMeta={rightThumbnailMeta}
            setThumbnailMeta={setRightThumbnailMeta}
            isAnyOutputTypeLoading={isAnyOutputTypeLoading}
            setAccessErrorInfo={setRightAccessErrorInfo}
            setUploadedPath={setRightUploadedPath}
          />
        </div>
        {(showDropzone || isEditing) && (
          <div className={css.buttons}>
            {showDropzone && isPro && (
              <DiffDropdown<PdfDiffOutputTypes>
                outputType={outputType}
                isDropdownOpen={isDropdownOpen}
                setOutputType={setOutputType}
                setIsDropdownOpen={setIsDropdownOpen}
                dropdownOutputTypes={pdfDropdownOutputTypes}
              />
            )}
            {isEditing && (
              <Button
                style="secondary"
                tone="base"
                size="large"
                onClick={cancelEdit}
              >
                {t('Diff.cancel')}
              </Button>
            )}
            {process.env.NEXT_PUBLIC_IS_ELECTRON &&
              !isEditing &&
              outputType === PdfDiffOutputTypes.Redline &&
              getOs() === 'windows' && (
                <Button
                  iconStartSvg={PreferencesSvg}
                  style="text"
                  tone="base"
                  size="large"
                  onClick={() => setInputSettingsModalOpen(true)}
                  className={css.settingsButton}
                >
                  Settings
                </Button>
              )}
            <Button
              style="primary"
              className={css.submitButton}
              tone="green"
              size="large"
              onClick={() => findDifference(leftState, rightState)}
              disabled={
                !leftIsReadyToBeDiffed ||
                !rightIsReadyToBeDiffed ||
                (isEditFilesSameAsParent && isEditPageRangeSameAsParent)
              }
            >
              {t('Diff.submit')}
            </Button>
          </div>
        )}
      </div>
      <Modal
        title="Styles"
        isOpen={inputSettingsModalOpen}
        closeModal={() => setInputSettingsModalOpen(false)}
        maxWidth="924px"
        classNames={{ modal: css.settingsModal }}
        diffBackgroundColor={true}
      >
        <PdfInputSettings
          profileName={'Default'}
          onClose={() => setInputSettingsModalOpen(false)}
        />
      </Modal>
      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <FileAccessErrorModal
          leftAccessErrorInfo={leftAccessErrorInfo}
          setLeftAccessErrorInfo={setLeftAccessErrorInfo}
          rightAccessErrorInfo={rightAccessErrorInfo}
          setRightAccessErrorInfo={setRightAccessErrorInfo}
          leftFilePath={leftUploadedPath}
          rightFilePath={rightUploadedPath}
          diffInputType={DiffInputType.PDF}
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

export default PdfInput;
