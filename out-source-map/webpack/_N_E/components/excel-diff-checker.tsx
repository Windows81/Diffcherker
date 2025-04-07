import cx from 'classnames';
import useEffectStateUpdate from 'lib/hooks/use-effect-state-update';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import * as React from 'react';
import { useMemo, useRef, useState, useEffect } from 'react';
import stringReplaceAll from 'string-replace-all';
import { DiffInputType } from 'types/diff-input-type';
import { type ExcelDiffStats } from 'types/excelDiff';
import css from './excel-diff-checker.module.css';
import Button from './shared/button';
import { useWorker } from 'lib/hooks/use-worker';
import {
  DiffTypeDropdownOutputType,
  ExcelDiffOutputTypes,
  NewOutputType,
} from 'lib/output-types';
import { Profile, useProfiles } from 'lib/state/profiles';
import { usePdfIsExporting } from 'lib/state/pdfExport';
import { Diff } from 'types/diff';
import ExcelDiffOutput from './excel-diff-output';
import { ExportToExcelRef } from './excel-diff-output-unified';
import ExcelUpload from './excel-upload';
import Loading from './loading';
import DiffOutputTypeSwitch from './new/diff-output-type-switch';
import DiffStats from './new/diff-stats';
import {
  TextDiffOutputSettingsObject,
  defaultTextDiffOutputSettings,
} from './new/text-diff-output/settings';
import UniversalDiffEditorHeader from './new/universal-diff-editor-header';
import IconButton from './shared/icon-button';
import Spreadsheet from './shared/icons/spreadsheet.svg';
import Switch from './shared/icons/switch.svg';
import Text from './shared/icons/text.svg';
import MessageBanner from './shared/message-banner';
import {
  ExcelDiffOutputApi,
  ExcelDiffOutputProvider,
} from './new/excel-diff/excel-output/context';
import ExcelDiffSidebar from './new/excel-diff-sidebar';
import { ExcelTransformationType } from './new/excel-diff/excel-output/excel-transformations';
import { RecordingInfo } from 'types/recordingInfo';
import { ExcelDiffOutputSettingsObject } from './new/excel-diff/excel-output/types';
import { AccessErrorInfo } from './file-access-error-modal';
import dynamic from 'next/dynamic';
import PreferencesSvg from './shared/icons/preferences.svg';
import Modal from 'components/shared/modal';
import ExcelInputSettings from './excel-input-settings';
import { DiffDropdown } from './diff-dropdown';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import useSpreadsheet, {
  SpreadsheetState,
} from 'lib/hooks/use-diff-spreadsheet';
import type { DiffWorkBookRequest } from 'types/xlsx-worker-types';
import Excel from 'lib/excel';
import DetailsSvg from 'components/shared/icons/details.svg';
import FileDetailsOutputContainer from './new/pdf-diff/pdf-output/file-details-output-container';
import ExcelMetadata from 'pages/excel-metadata';

export interface StartingLineNumbers {
  left: number;
  right: number;
}

interface ExcelDiffCheckerProps {
  initialLeftPath?: string;
  initialRightPath?: string;
  recordingInfo?: RecordingInfo;
  outputType: ExcelDiffOutputTypes;
  setOutputType: (val: ExcelDiffOutputTypes) => void;
  diffOrigin?: string;
}

const excelDropdownOutputTypes: DiffTypeDropdownOutputType<ExcelDiffOutputTypes>[] =
  [
    {
      label: ExcelDiffOutputTypes.Table,
      value: ExcelDiffOutputTypes.Table,
      description: 'Compile documents into single version with marked changes',
      image: dynamic(
        () => import('static/images/new/dropdown-table-excel.svg'),
        {
          ssr: false,
        },
      ) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
    {
      label: ExcelDiffOutputTypes.Text,
      value: ExcelDiffOutputTypes.Text,
      description: 'Compare the contents of both documents as plain text',
      image: dynamic(
        () => import('static/images/new/dropdown-plain-text-excel.svg'),
        {
          ssr: false,
        },
      ) as React.FC<React.SVGProps<SVGSVGElement>>,
    },
  ];

const outputTypes: Array<NewOutputType<ExcelDiffOutputTypes>> = [
  { icon: Spreadsheet, name: ExcelDiffOutputTypes.Table },
  { icon: Text, name: ExcelDiffOutputTypes.Text },
  { icon: DetailsSvg, name: ExcelDiffOutputTypes['File details'] },
];

const ExcelDiffChecker: React.FC<ExcelDiffCheckerProps> = (
  props: ExcelDiffCheckerProps,
) => {
  /*
   * Main spreadsheet states that store the "committed" sheets that the user wants to compare.
   */
  const {
    state: leftState,
    setState: setLeftState,
    setCsv: setLeftCsv,
  } = useSpreadsheet();
  const {
    state: rightState,
    setState: setRightState,
    setCsv: setRightCsv,
  } = useSpreadsheet();

  /**
   * Temporary states for the left and right sheets that are used to store the original state of the sheets.
   * This is used to reset the state of the sheets to the original state if the user cancels the edit.
   */
  const {
    state: tempLeftState,
    setWorkBook: setTempLeftWorkBook,
    setId: setLeftId,
    setSheetName: setTempLeftSheetName,
    setFileInfo: setTempLeftFileInfo,
    setHeaderLineNumber: setTempLeftHeaderLineNumber,
    setState: setTempLeftState,
    clearState: clearTempLeftState,
  } = useSpreadsheet();
  const {
    state: tempRightState,
    setWorkBook: setTempRightWorkBook,
    setId: setRightId,
    setSheetName: setTempRightSheetName,
    setFileInfo: setTempRightFileInfo,
    setHeaderLineNumber: setTempRightHeaderLineNumber,
    setState: setTempRightState,
    clearState: clearTempRightState,
  } = useSpreadsheet();

  const [diffStats, setDiffStats] = useState<ExcelDiffStats | null>(null);
  const [createdTextDiff, setCreatedTextDiff] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(Boolean(false)); // assumes loading only happens when diff is being computed
  const [leftAccessErrorInfo, setLeftAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);
  const [rightAccessErrorInfo, setRightAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);

  const [diffResult, setDiffResult] = useState<string[][] | null>(null);
  const [isEditingUpload, setIsEditingUpload] = useState<boolean>(false);
  const exportStatus = usePdfIsExporting();
  const [textDiff, setTextDiff] = useState<Diff>();
  const [textDiffOutputSettings, setTextDiffOutputSettings] =
    useState<TextDiffOutputSettingsObject>(defaultTextDiffOutputSettings);
  const excelDiffOutputApiRef = useRef<ExcelDiffOutputApi>(null);
  const [leftPath, setLeftPath] = useState<string>('');
  const [rightPath, setRightPath] = useState<string>('');
  // these upload paths are only used for error handling
  const [leftUploadedPath, setLeftUploadedPath] = useState<string>('');
  const [rightUploadedPath, setRightUploadedPath] = useState<string>('');

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [normalizeWorker] = useWorker('normalize', { restartable: true });
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [profiles] = useProfiles();
  const currentProfile = profiles.find(
    (profile: Profile) => profile.name === 'Default',
  );

  const [excelDiffOutputSettings, setExcelDiffOutputSettings] =
    useState<ExcelDiffOutputSettingsObject>(
      currentProfile?.configurations[DiffInputType.EXCEL],
    );

  useEffect(() => {
    return () => {
      Excel.destroyAllSpreadsheets();
    };
  }, []);

  useEffect(() => {
    setExcelDiffOutputSettings(
      currentProfile?.configurations[DiffInputType.EXCEL],
    );
  }, [currentProfile?.configurations[DiffInputType.EXCEL]]);

  const { initialLeftPath, initialRightPath, diffOrigin } = props;

  const currentType = props.outputType;
  const isPro = useAppSelector(isProUser);
  const showEditUpload = isEditingUpload && !exportStatus;
  const showDropzone = !diffResult;
  const disableFindDifference =
    tempRightState.fileInfo.filename === rightState.fileInfo.filename &&
    tempLeftState.fileInfo.filename === leftState.fileInfo.filename &&
    rightState.sheetName === tempRightState.sheetName &&
    leftState.sheetName === tempLeftState.sheetName &&
    tempLeftState.headerLineNumber === leftState.headerLineNumber &&
    tempRightState.headerLineNumber === rightState.headerLineNumber;

  const diffLoadingCallback = () => {
    if (loading) {
      // setTimeout batches state updates within executeDiff so that the component re-renders only on loading state change.
      // This is to prevent the component from batching together the loading and diffResult renders.
      setTimeout(() => executeDiff(leftState, rightState));
    }
  };

  const clearResult = () => {
    setDiffResult(null);
    setDiffStats(null);
    setTextDiff(undefined);
  };

  const clearTempStates = () => {
    clearTempLeftState();
    clearTempRightState();
  };

  const cancelEdit = () => {
    setIsEditingUpload(false);
    clearTempStates();
    setLeftPath(leftState.fileInfo.filePath || '');
    setRightPath(rightState.fileInfo.filePath || '');
    Excel.destroySpreadsheetsExcept(leftState.id, rightState.id);
  };

  const [selectedTransformation, setSelectedTransformation] =
    useState<ExcelTransformationType>(ExcelTransformationType.None);

  const executeDiff = async (
    leftState: SpreadsheetState,
    rightState: SpreadsheetState,
  ): Promise<void> => {
    const { stats, diffResult, CSVs } = await Excel.generateDiff({
      sides: { left: leftState.workBook, right: rightState.workBook },
      sheetNames: {
        left: leftState.sheetName,
        right: rightState.sheetName,
      },
      headerLineNumbers: {
        left: processLineNumber(leftState.headerLineNumber),
        right: processLineNumber(rightState.headerLineNumber),
      },
      transformationType: selectedTransformation,
      settings: excelDiffOutputSettings[ExcelDiffOutputTypes.Table],
    } as DiffWorkBookRequest);
    setLeftCsv(CSVs.left);
    setRightCsv(CSVs.right);
    Tracking.trackEvent('Created diff', {
      diffInputType: DiffInputType.EXCEL,
    });
    setDiffStats(stats);
    setDiffResult(diffResult);
    if (currentType === ExcelDiffOutputTypes.Text) {
      const { data: textDiffData } = await normalizeWorker({
        left: formatForTextDiff(CSVs.left),
        right: formatForTextDiff(CSVs.right),
        diffLevel: textDiffOutputSettings.diffLevel,
      });

      if (textDiffData) {
        setTextDiff(textDiffData);
        setCreatedTextDiff(true);
      }
    }
    setSelectedTransformation(ExcelTransformationType.None);
    setLoading(false);
    // only unmount edit menu after diff is computed, since line numbers are needed for diff calc and are undefined when unmounted.
    setIsEditingUpload(false);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON && leftPath && rightPath) {
      const { addRecentDiff } = await import(
        'components/new/recent-diffs/commands/recent-diff-utils'
      );
      addRecentDiff({
        left: {
          filePath: leftPath,
        },
        right: {
          filePath: rightPath,
        },
        diffType: DiffInputType.EXCEL,
      });
    }
  };

  useEffectStateUpdate(diffLoadingCallback, [loading]);

  const openEditSettings = (): void => {
    setTempLeftState(leftState);
    setTempRightState(rightState);
    setIsEditingUpload(true);
  };

  const findDifference = ({
    findDifferenceForNewFiles,
  }: {
    findDifferenceForNewFiles: boolean;
  }): void => {
    setLoading(true);
    setIsEditingUpload(false);
    clearResult();

    // Need to explicitly clear the csv strings to resolve memory leaks
    leftState.csv = '';
    rightState.csv = '';

    if (findDifferenceForNewFiles) {
      setLeftState({
        ...tempLeftState,
        // Need to explicitly set filePath to ensure it's not null
        csv: '',
        fileInfo: { ...tempLeftState.fileInfo, filePath: leftPath },
      });
      setRightState({
        ...tempRightState,
        // Need to explicitly set filePath to ensure it's not null
        csv: '',
        fileInfo: { ...tempRightState.fileInfo, filePath: rightPath },
      });
      Excel.destroySpreadsheetsExcept(tempLeftState.id, tempRightState.id);
    }
    clearTempStates();
  };

  const handleSwap = () => {
    if (!leftState.workBook || !rightState.workBook) {
      return;
    }

    let temp, tempPath;
    if (!isEditingUpload) {
      temp = { ...leftState };
      tempPath = leftPath;

      setLeftState(rightState);
      setLeftPath(rightPath);
      setRightState(temp);
      setRightPath(tempPath);

      findDifference({ findDifferenceForNewFiles: false });
    } else {
      temp = { ...tempLeftState };
      tempPath = leftPath;

      setTempLeftState(tempRightState);
      setLeftPath(rightPath);
      setTempRightState(temp);
      setRightPath(tempPath);
    }
  };

  const formatForTextDiff = (sheet: string) => {
    return stringReplaceAll(
      sheet
        .split('\n')
        .map((row) => (RegExp(/^,+$/).test(row) ? '' : row))
        .join('\n'),
      ',',
      ', ',
    );
  };

  const processLineNumber = (
    lineNumber: string | number | undefined,
  ): number => {
    if (!lineNumber) {
      return 1;
    }
    let num = Number(lineNumber);
    if (isNaN(num) && num < 1) {
      num = 1;
    }
    return num;
  };

  const handleTypeChange = async (option: ExcelDiffOutputTypes) => {
    if (!leftState.workBook || !rightState.workBook) {
      return;
    }
    if (option === ExcelDiffOutputTypes.Table) {
      setCreatedTextDiff(false);
      props.setOutputType(ExcelDiffOutputTypes.Table);
    } else if (option === ExcelDiffOutputTypes.Text) {
      const { data: textDiffData } = await normalizeWorker({
        left: formatForTextDiff(leftState.csv),
        right: formatForTextDiff(rightState.csv),
        diffLevel: textDiffOutputSettings.diffLevel,
      });

      if (textDiffData) {
        setTextDiff(textDiffData);
        setCreatedTextDiff(true);
      }
      setCreatedTextDiff(true);
      props.setOutputType(ExcelDiffOutputTypes.Text);
    } else {
      setCreatedTextDiff(false);
      props.setOutputType(ExcelDiffOutputTypes['File details']);
    }
    Tracking.trackEvent('Changed diff output type', {
      diffInputType: DiffInputType.EXCEL,
      changedTo: option,
    });
  };

  const excelExportFuncRef = useRef<ExportToExcelRef>(null);

  const renderDiffOutput = useMemo(() => {
    if (!diffResult) {
      return undefined;
    }
    return (
      <ExcelDiffOutput
        diffTable={diffResult}
        diff={textDiff}
        createdTextDiff={createdTextDiff}
        onTextDiffOuputSettingsChange={setTextDiffOutputSettings}
        maxLines={Math.max(
          leftState.csv.split('\n').length,
          rightState.csv.split('\n').length,
        )}
        ref={excelExportFuncRef}
      />
    );
    // Only render updates to the table when the actual diff table changes, otherwise extremely costly render for large tables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffResult, textDiff, createdTextDiff]);

  const diffStatComponent = diffStats && (
    <DiffStats
      added={diffStats.added}
      removed={diffStats.removed}
      reordered={diffStats.reordered}
    />
  );

  return (
    <>
      <ExcelDiffOutputProvider
        apiRef={excelDiffOutputApiRef}
        findDifference={async () => {
          findDifference({ findDifferenceForNewFiles: false });
        }}
        setSelectedTransformation={setSelectedTransformation}
      >
        <div
          className={cx(css.excelDiffChecker, {
            [css.isEdit]: showEditUpload,
            [css.isResultScreen]: !!diffResult,
            [css.isElectron]: process.env.NEXT_PUBLIC_IS_ELECTRON,
          })}
        >
          <div className={css.excelHeader}>
            <div
              className={cx(css.inputContainer, {
                [css.loading]: loading,
                [css.dropzone]: !diffResult,
              })}
            >
              <ExcelUpload
                setId={setLeftId}
                clearState={clearTempLeftState}
                setFileInfo={setTempLeftFileInfo}
                setWorkBook={setTempLeftWorkBook}
                setSheetName={setTempLeftSheetName}
                fileInfo={tempLeftState.fileInfo}
                parentFileInfo={leftState.fileInfo}
                initialFilePath={initialLeftPath}
                selectedSheet={tempLeftState.sheetName}
                workBook={tempLeftState.workBook}
                side="left"
                editUploadSettings={showEditUpload}
                openEditSettings={openEditSettings}
                headerLineState={{
                  value: tempLeftState.headerLineNumber,
                  setValue: (lineNumber) =>
                    setTempLeftHeaderLineNumber(lineNumber),
                }}
                recordingInfo={props.recordingInfo}
                filePath={leftPath}
                showDropzone={showDropzone}
                setFilePath={setLeftPath}
                setAccessErrorInfo={setLeftAccessErrorInfo}
                setUploadedPath={setLeftUploadedPath}
              />
              {!!diffResult && (
                <IconButton
                  size="small"
                  style="text"
                  tone="base"
                  svg={Switch}
                  aria-label="Switch sheets"
                  onClick={handleSwap}
                  disabled={
                    // Disable the swap button if an uploaded file is still loading in the edit header OR there was an error uploading the file.
                    showEditUpload &&
                    (!tempLeftState.workBook || !tempRightState.workBook)
                  }
                />
              )}
              <ExcelUpload
                setId={setRightId}
                clearState={clearTempRightState}
                setFileInfo={setTempRightFileInfo}
                setWorkBook={setTempRightWorkBook}
                setSheetName={setTempRightSheetName}
                parentFileInfo={rightState.fileInfo}
                fileInfo={tempRightState.fileInfo}
                initialFilePath={initialRightPath}
                selectedSheet={tempRightState.sheetName}
                workBook={tempRightState.workBook}
                side="right"
                editUploadSettings={showEditUpload}
                openEditSettings={openEditSettings}
                headerLineState={{
                  value: tempRightState.headerLineNumber,
                  setValue: (lineNumber) =>
                    setTempRightHeaderLineNumber(lineNumber),
                }}
                recordingInfo={props.recordingInfo}
                filePath={rightPath}
                showDropzone={showDropzone}
                setFilePath={setRightPath}
                setUploadedPath={setRightUploadedPath}
                setAccessErrorInfo={setRightAccessErrorInfo}
              />
            </div>
            {(showEditUpload || !diffResult) && (
              <div className={css.buttons}>
                {!diffResult && !isEditingUpload && isPro && (
                  <DiffDropdown<ExcelDiffOutputTypes>
                    outputType={props.outputType}
                    isDropdownOpen={isDropdownOpen}
                    setOutputType={props.setOutputType}
                    setIsDropdownOpen={setIsDropdownOpen}
                    dropdownOutputTypes={excelDropdownOutputTypes}
                    disabled={loading}
                  />
                )}
                {process.env.NEXT_PUBLIC_IS_ELECTRON &&
                  !isEditingUpload &&
                  props.outputType === ExcelDiffOutputTypes.Table && (
                    <Button
                      iconStartSvg={PreferencesSvg}
                      style="text"
                      tone="base"
                      size="large"
                      onClick={() => setModalOpen(true)}
                      className={css.settingsButton}
                      disabled={loading}
                    >
                      Settings
                    </Button>
                  )}
                {isEditingUpload && !loading && (
                  <Button
                    style="secondary"
                    tone="base"
                    size="large"
                    onClick={cancelEdit}
                  >
                    {t('Diff.cancel')}
                  </Button>
                )}
                <Button
                  style="primary"
                  tone="green"
                  onClick={() =>
                    findDifference({ findDifferenceForNewFiles: true })
                  }
                  disabled={
                    !(tempLeftState.sheetName && tempRightState.sheetName) ||
                    disableFindDifference
                  }
                  size="large"
                  isLoading={loading}
                >
                  {t('Diff.submit')}
                </Button>
              </div>
            )}
          </div>
          {diffStats && !loading && (
            <div className={css.controlBar}>
              <div className={css.outputTypeSwitch}>
                <DiffOutputTypeSwitch
                  onTypeChange={handleTypeChange}
                  outputTypes={outputTypes}
                  currentlySelectedType={currentType}
                />
              </div>
              <UniversalDiffEditorHeader
                type={currentType}
                exportToExcel={() => {
                  excelExportFuncRef.current?.exportToExcel();
                }}
              />
            </div>
          )}
          {diffStats && !loading && (
            <div className={css.excelDiffOutputContainer}>
              {currentType !== ExcelDiffOutputTypes['File details'] && (
                <ExcelDiffSidebar
                  apiRef={excelDiffOutputApiRef}
                  setExcelDiffOutputSettings={setExcelDiffOutputSettings}
                  findDifference={() =>
                    findDifference({ findDifferenceForNewFiles: false })
                  }
                  excelDiffOutputSettings={excelDiffOutputSettings}
                  currentType={currentType}
                  clearResult={clearResult}
                />
              )}
              <div className={css.excelDiffOutput}>
                {diffStats && leftState.csv == rightState.csv && (
                  <div className={css.identicalSheets}>
                    <MessageBanner
                      type="info"
                      title="The two sheets are identical"
                      message={
                        'There is no difference to show between these two sheets'
                      }
                    />
                  </div>
                )}
                {(currentType === ExcelDiffOutputTypes.Text ||
                  currentType === ExcelDiffOutputTypes.Table) && (
                  <div
                    className={cx(css.main, {
                      [css.textDiffPadding]:
                        currentType == ExcelDiffOutputTypes.Text,
                    })}
                  >
                    {currentType === ExcelDiffOutputTypes.Table &&
                      diffStatComponent}
                    {renderDiffOutput}
                  </div>
                )}
                {currentType === ExcelDiffOutputTypes['File details'] && (
                  <FileDetailsOutputContainer>
                    <ExcelMetadata
                      left={leftState.workBook?.Props as ExcelMetadata}
                      right={rightState.workBook?.Props as ExcelMetadata}
                    />
                  </FileDetailsOutputContainer>
                )}
              </div>
            </div>
          )}
          {loading && (
            <div className={css.loader}>
              <Loading message="Computing difference" />
            </div>
          )}
        </div>
        <Modal
          title="Styles"
          isOpen={modalOpen}
          closeModal={() => setModalOpen(false)}
          maxWidth="924px"
          classNames={{ modal: css.settingsModal }}
          diffBackgroundColor={true}
        >
          <ExcelInputSettings onClose={() => setModalOpen(false)} />
        </Modal>
      </ExcelDiffOutputProvider>
      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <FileAccessErrorModal
          leftAccessErrorInfo={leftAccessErrorInfo}
          setLeftAccessErrorInfo={setLeftAccessErrorInfo}
          rightAccessErrorInfo={rightAccessErrorInfo}
          setRightAccessErrorInfo={setRightAccessErrorInfo}
          leftFilePath={leftUploadedPath}
          rightFilePath={rightUploadedPath}
          diffInputType={DiffInputType.EXCEL}
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

export default ExcelDiffChecker;
