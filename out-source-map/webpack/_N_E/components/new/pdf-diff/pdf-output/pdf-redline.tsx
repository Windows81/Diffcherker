import * as React from 'react';
import { useHotkeys } from 'lib/hooks/use-hotkeys';
import cx from 'classnames';
import sharedCss from './pdf-output-shared.module.css';
import css from './pdf-redline.module.css';
import dropdownCss from '../../../shared/dropdown.module.css';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import MessageBanner from 'components/shared/message-banner';
import PdfDisplay from '../pdf-display/pdf-display';
import PdfSidebar from './pdf-sidebar';
import Button from 'components/shared/button';
import Tab from 'components/shared/tab';
import ipcEvents from 'ipc-events';
import Tracking from 'lib/tracking';
import Icon from 'components/shared/icon';
import UploadSvg from 'components/shared/icons/upload.svg';
import { PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';
import { RedlineViewType } from 'types/redline-view-type';
import { RedlinePageChangeDirection } from 'types/redline-page-change-direction';
import { ZoomTypeOption } from 'types/zoom-type-option';
import { t } from 'lib/react-tiny-i18n';
import { RedlineOutputSettingsObject } from 'components/new/redline-output/settings';
import DiffCheckbox from 'components/new/diff-checkbox';
import SegmentedSwitch from 'components/shared/segmented-switch';
import Dropdown from 'components/shared/dropdown';
import { FontColorOptions } from 'components/new/redline-output/settings';
import { RedlineOversizedPages } from '../pdf-diff-checker';
import RedlineConversionBanner from 'components/new/redline-conversion-banner';
import {
  RedlineRevision,
  RevisionSummarySectionStats,
  RevisionSummarySections,
  isDeleteRevision,
  isInsertRevision,
  isMoveRevision,
  isStyleRevision,
} from 'lib/redline/get-revisions';
import { RedlineErrorMessages } from 'lib/redline/redline-error-messages';
import IconButton from 'components/shared/icon-button';
import PlusCircleIcon from 'web/components/shared/icons/plus-circle.svg';
import MinusCircleIcon from 'web/components/shared/icons/minus-circle.svg';
import MoveCircleIcon from 'web/components/shared/icons/move-circle.svg';
import EditCircle from 'web/components/shared/icons/edit-circle.svg';
import MinusSvg from 'web/components/shared/icons/minus.svg';
import PlusSvg from 'web/components/shared/icons/plus.svg';
import MoveSvg from 'web/components/shared/icons/move.svg';
import EditSvg from 'web/components/shared/icons/edit.svg';
import ChevronDownSvg from 'web/components/shared/icons/chevron-down.svg';
import ArrowUpSvg from 'web/components/shared/icons/arrow-up.svg';
import ArrowDownSvg from 'web/components/shared/icons/arrow-down.svg';
import Checkbox from 'components/shared/checkbox';
import { devLog } from 'lib/logger';
import { formatDateObject } from 'lib/format-date-object';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RedlineLoadingProps {}

const RedlineLoading: React.FC<RedlineLoadingProps> = () => {
  return (
    <div className={cx(sharedCss.output, sharedCss.grey, sharedCss.loader)}>
      <LoadingCircle style="secondary" />
      <span className={sharedCss.mainLoadingText}>Loading redline...</span>
      <span>Diffchecker is generating your redline.</span>
      {window.machine?.platform === 'darwin' && (
        <span>
          Please look at your Microsoft Word app and give it any permissions it
          requires.
        </span>
      )}
    </div>
  );
};

const convertCamelCaseToSpacedWords = (camelCaseString: string): string => {
  return camelCaseString.replace(/([A-Z])/g, ' $1').trim();
};

interface RedlineOutputContainerProps {
  redlinePDFiumContent?: PDFiumDocumentContent;
  redlineOutputSettings: RedlineOutputSettingsObject;
  redlineError?: string;
  redlinePdf?: PdfConversionResult;
  redlineWordDoc?: WordDocumentInfo;
  handleRedlineSettingsChange: (
    newRedlineSettings: RedlineOutputSettingsObject,
  ) => void;
  redlineOversizedPages?: RedlineOversizedPages;
  leftFilename: string;
  rightFilename: string;
  leftFilePath?: string;
  rightFilePath?: string;
  showRedlineConversionBanner: boolean;
  setShowRedlineConversionBanner: (value: boolean) => void;
  redlineRevisions: RedlineRevision[];
  setRedlineRevisions: React.Dispatch<React.SetStateAction<RedlineRevision[]>>;
  redlineRevisionSummary?: RevisionSummarySections;
  selectedRedlineRevision: RedlineRevision | null;
  setSelectedRedlineRevision: (value: RedlineRevision | null) => void;
  redlineRevisionError?: string;
  redlineRevisionsLoading: boolean;
  isExportingAcceptedRevisions: boolean;
  setIsExportingAcceptedRevisions: (value: boolean) => void;
  redlineViewType: RedlineViewType;
  setRedlineViewType: (value: RedlineViewType) => void;
  redlineZoomType: ZoomTypeOption;
  setRedlineZoomType: (value: ZoomTypeOption) => void;
  redlineDiffedAt?: Date;
}

const RedlineOutputContainer: React.FC<RedlineOutputContainerProps> = ({
  redlinePDFiumContent,
  redlineOutputSettings,
  redlineError,
  redlinePdf,
  redlineWordDoc,
  redlineOversizedPages,
  leftFilename,
  rightFilename,
  leftFilePath,
  rightFilePath,
  showRedlineConversionBanner,
  setShowRedlineConversionBanner,
  redlineRevisions,
  setRedlineRevisions,
  redlineRevisionSummary,
  selectedRedlineRevision,
  setSelectedRedlineRevision,
  redlineRevisionError,
  handleRedlineSettingsChange,
  redlineRevisionsLoading,
  isExportingAcceptedRevisions,
  setIsExportingAcceptedRevisions,
  redlineViewType,
  setRedlineViewType,
  redlineZoomType,
  setRedlineZoomType,
  redlineDiffedAt,
}) => {
  useHotkeys('cmd+f', (e) => {
    // Override default search behavior when on Windows and redline doc is loaded
    if (
      process.env.NEXT_PUBLIC_IS_ELECTRON &&
      window.machine?.platform === 'win32' &&
      redlineWordDoc
    ) {
      window.ipcRenderer.send(ipcEvents.APP__REDLINE_ENABLE_SEARCH);
      e.preventDefault();
    }
  });

  if (
    process.env.NEXT_PUBLIC_IS_ELECTRON &&
    !redlineError &&
    (window.machine?.platform === 'win32'
      ? !redlineWordDoc
      : !redlinePDFiumContent)
  ) {
    return <RedlineLoading />;
  }

  return (
    <div className={sharedCss.container}>
      {process.env.NEXT_PUBLIC_IS_ELECTRON &&
        window.machine?.platform === 'win32' && (
          <RedlineSidebar
            redlineOutputSettings={redlineOutputSettings}
            handleRedlineSettingsChange={handleRedlineSettingsChange}
            revisions={redlineRevisions}
            setRevisions={setRedlineRevisions}
            revisionSummary={redlineRevisionSummary}
            selectedRevision={selectedRedlineRevision}
            setSelectedRevision={setSelectedRedlineRevision}
            redlineRevisionError={redlineRevisionError}
            redlineRevisionsLoading={redlineRevisionsLoading}
            isExportingAcceptedRevisions={isExportingAcceptedRevisions}
            setIsExportingAcceptedRevisions={setIsExportingAcceptedRevisions}
            leftFilePath={leftFilePath}
            rightFilePath={rightFilePath}
            redlineDiffedAt={redlineDiffedAt}
          />
        )}
      <div className={sharedCss.content}>
        {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <MessageBanner
            type="info"
            title="Redline is not available on the web"
            message={RedlineErrorMessages.NOT_DESKTOP}
          />
        )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON && redlineError && (
          <MessageBanner
            type="error"
            title="Redline Error"
            message={redlineError}
          />
        )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON &&
          redlineOversizedPages &&
          // Does not show the banner if the user has closed it
          showRedlineConversionBanner && (
            <RedlineConversionBanner
              pages={redlineOversizedPages}
              leftFilename={leftFilename}
              rightFilename={rightFilename}
              setShowRedlineConversionBanner={setShowRedlineConversionBanner}
            />
          )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON &&
          window.machine?.platform === 'win32' && (
            <RedlineTopToolbar
              redlineViewType={redlineViewType}
              setRedlineViewType={setRedlineViewType}
              redlineZoomType={redlineZoomType}
              setRedlineZoomType={setRedlineZoomType}
            />
          )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <div
            className={cx(
              sharedCss.output,
              sharedCss.grey,
              css.redlinePDFOutput,
            )}
          >
            {redlinePDFiumContent && window.machine?.platform !== 'win32' && (
              <PdfDisplay content={redlinePDFiumContent} />
            )}
          </div>
        )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <RedlineBottomToolbar
            redlinePdf={redlinePdf}
            redlineWordDoc={redlineWordDoc}
          />
        )}
      </div>
    </div>
  );
};

const RedlineSidebar = ({
  redlineOutputSettings,
  handleRedlineSettingsChange,
  revisions,
  setRevisions,
  revisionSummary,
  selectedRevision,
  setSelectedRevision,
  redlineRevisionError,
  redlineRevisionsLoading,
  isExportingAcceptedRevisions,
  setIsExportingAcceptedRevisions,
  leftFilePath,
  rightFilePath,
  redlineDiffedAt,
}: {
  redlineOutputSettings: RedlineOutputSettingsObject;
  handleRedlineSettingsChange: (value: RedlineOutputSettingsObject) => void;
  revisions: RedlineRevision[];
  setRevisions: React.Dispatch<React.SetStateAction<RedlineRevision[]>>;
  revisionSummary?: RevisionSummarySections;
  selectedRevision: RedlineRevision | null;
  setSelectedRevision: (value: RedlineRevision | null) => void;
  redlineRevisionError?: string;
  redlineRevisionsLoading: boolean;
  isExportingAcceptedRevisions: boolean;
  setIsExportingAcceptedRevisions: (value: boolean) => void;
  leftFilePath?: string;
  rightFilePath?: string;
  redlineDiffedAt?: Date;
}) => {
  const [selectedTab, setSelectedTab] = React.useState<
    'tools' | 'changes' | 'summary'
  >('changes');
  const [isInsertionDropdownOpen, setIsInsertionDropdownOpen] =
    React.useState(false);
  const [isDeletedDropdownOpen, setIsDeletedDropdownOpen] =
    React.useState(false);
  // This temporarily holds any changes made to redline settings. It updates the final state when the user clicks apply changes.
  const [changedRedlineSettings, setChangedRedlineSettings] = React.useState(
    redlineOutputSettings,
  );
  const [lastAppliedRedlineSettings, setLastAppliedRedlineSettings] =
    React.useState<RedlineOutputSettingsObject>(redlineOutputSettings);
  const hasAcceptedRevisions = React.useMemo(
    () => revisions.some((revision) => revision.isAccepted),
    [revisions],
  );

  return (
    <PdfSidebar
      header={
        <div className={sharedCss.tabs}>
          <Tab
            label="Changes"
            selectTab={() => setSelectedTab('changes')}
            isSelected={selectedTab === 'changes'}
          />
          <Tab
            label="Tools"
            selectTab={() => setSelectedTab('tools')}
            isSelected={selectedTab === 'tools'}
          />
          <Tab
            label="Summary"
            selectTab={() => setSelectedTab('summary')}
            isSelected={selectedTab === 'summary'}
          />
        </div>
      }
      instantTransition
      isRedline
      width={300}
    >
      <div className={css.sidebarContent}>
        {selectedTab === 'changes' && (
          <>
            {redlineRevisionsLoading ? (
              <div className={cx(sharedCss.sidebarLoader)}>
                <LoadingCircle style="secondary" size="small" />
                <span>Loading revisions...</span>
              </div>
            ) : (
              <div className={css.revisionsContainer}>
                <div className={css.revisionsHeader}>
                  <div
                    className={cx(
                      css.revisionSummaryItem,
                      css.revisionSummaryAll,
                    )}
                  >
                    All {revisions.length}
                  </div>
                  <div
                    className={cx(
                      css.revisionSummaryItem,
                      css.revisionSummaryDelete,
                    )}
                  >
                    <Icon svg={MinusSvg} size="xs" />
                    {revisionSummary?.totals.delete ?? 0}
                  </div>
                  <div
                    className={cx(
                      css.revisionSummaryItem,
                      css.revisionSummaryInsert,
                    )}
                  >
                    <Icon svg={PlusSvg} size="xs" />
                    {revisionSummary?.totals.insert ?? 0}
                  </div>
                  <div
                    className={cx(
                      css.revisionSummaryItem,
                      css.revisionSummaryMove,
                    )}
                  >
                    <Icon svg={MoveSvg} size="small" />
                    {(revisionSummary?.totals.movesFrom ?? 0) +
                      (revisionSummary?.totals.movesTo ?? 0)}
                  </div>
                  <div
                    className={cx(
                      css.revisionSummaryItem,
                      css.revisionSummaryStyle,
                    )}
                  >
                    <Icon svg={EditSvg} size="xs" />
                    {revisionSummary?.formatting.total ?? 0}
                  </div>
                </div>
                <div className={css.revisionsList}>
                  {redlineRevisionError ? (
                    <div>
                      <MessageBanner
                        type="error"
                        title="Error loading revisions"
                      />
                    </div>
                  ) : revisions.length === 0 ? (
                    <div>No changes found</div>
                  ) : (
                    revisions.map((revision, i) => (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                      <div
                        key={i}
                        className={cx(css.revision, {
                          [css.revisionSelected]:
                            selectedRevision?.rangeStartPos ===
                              revision.rangeStartPos &&
                            selectedRevision?.rangeEndPos ===
                              revision.rangeEndPos &&
                            selectedRevision?.storyType ===
                              revision.storyType &&
                            selectedRevision?.type === revision.type &&
                            selectedRevision?.text === revision.text,
                        })}
                        onClick={() => {
                          devLog('revision clicked', revision);
                          setSelectedRevision(revision);
                          window.ipcRenderer.send(
                            ipcEvents.APP__REDLINE_SCROLL_TO_REVISION,
                            {
                              revisionIndex: revision.index,
                              revisionStartPos: revision.rangeStartPos,
                              revisionEndPos: revision.rangeEndPos,
                              storyType: revision.storyType,
                            },
                          );
                        }}
                      >
                        <span
                          className={cx(css.revisionNumber, {
                            [css.revisionNumberWide]: revisions.length > 99,
                          })}
                        >
                          {i + 1}
                        </span>
                        <span className={css.revisionCheckboxContainer}>
                          <Checkbox
                            isOn={revision.isAccepted}
                            onClick={() => {
                              setRevisions((prevRevisions) =>
                                prevRevisions.map((rev) =>
                                  rev === revision
                                    ? { ...rev, isAccepted: !rev.isAccepted }
                                    : rev,
                                ),
                              );
                            }}
                          />
                        </span>
                        <span>
                          {isInsertRevision(revision) ? (
                            <Icon
                              className={css.revisionInsertIcon}
                              svg={PlusCircleIcon}
                              size="small"
                            />
                          ) : isDeleteRevision(revision) ? (
                            <Icon
                              className={css.revisionDeleteIcon}
                              svg={MinusCircleIcon}
                              size="small"
                            />
                          ) : isMoveRevision(revision) ? (
                            <Icon
                              className={css.revisionMoveIcon}
                              svg={MoveCircleIcon}
                              size="small"
                            />
                          ) : isStyleRevision(revision) ? (
                            <Icon
                              className={css.revisionStyleIcon}
                              svg={EditCircle}
                              size="small"
                            />
                          ) : null}
                        </span>
                        <span
                          className={cx(css.revisionText, {
                            [css.revisionInsertText]:
                              isInsertRevision(revision),
                            [css.revisionDeleteText]:
                              isDeleteRevision(revision),
                            [css.revisionMoveText]: isMoveRevision(revision),
                            [css.revisionStyleText]: isStyleRevision(revision),
                          })}
                        >
                          {revision.type === 'wdRevisionCellInsertion'
                            ? 'Table Cell Insertion'
                            : revision.type === 'wdRevisionCellDeletion'
                              ? 'Table Cell Deletion'
                              : revision.text
                                ? // This regex makes sure that UI doesn't show huge gaps if sequential newlines exist
                                  revision.text
                                    .replace(/\n{3,}/g, '\n\n')
                                    .slice(0, 300) +
                                  (revision.text.length >= 300 ? '...' : '')
                                : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  style="primary"
                  tone="green"
                  size="large"
                  onClick={() => {
                    const acceptedRevisionsData = revisions
                      .filter((revision) => revision.isAccepted)
                      .map((revision) => ({
                        revisionIndex: revision.index,
                        revisionStartPos: revision.rangeStartPos,
                        revisionEndPos: revision.rangeEndPos,
                        revisionStoryType: revision.storyType,
                        revisionType: revision.type,
                      }));
                    window.ipcRenderer.send(
                      ipcEvents.APP__REDLINE_EXPORT_WITH_ACCEPTED_REVISIONS,
                      acceptedRevisionsData,
                    );
                    setIsExportingAcceptedRevisions(true);
                  }}
                  fullWidth={true}
                  disabled={
                    !hasAcceptedRevisions && !isExportingAcceptedRevisions
                  }
                  isLoading={isExportingAcceptedRevisions}
                >
                  Export with Accepted Revisions
                </Button>
              </div>
            )}
          </>
        )}
        {selectedTab === 'tools' && (
          <>
            <div className={css.section}>
              <div className={sharedCss.sectionTitle}>Insertion Color</div>
              <Dropdown<string>
                isOpen={isInsertionDropdownOpen}
                setIsOpen={(value: boolean) =>
                  setIsInsertionDropdownOpen(value)
                }
                options={Object.keys(FontColorOptions).map((color) => ({
                  value: color,
                  label: convertCamelCaseToSpacedWords(color),
                }))}
                onChange={(option) => {
                  setChangedRedlineSettings({
                    ...changedRedlineSettings,
                    insertedColor: option.value,
                  });
                }}
                display={convertCamelCaseToSpacedWords(
                  changedRedlineSettings.insertedColor,
                )}
              />
            </div>
            <div className={css.section}>
              <div className={sharedCss.sectionTitle}>Deletion Color</div>
              <Dropdown<string>
                isOpen={isDeletedDropdownOpen}
                setIsOpen={(value: boolean) => setIsDeletedDropdownOpen(value)}
                options={Object.keys(FontColorOptions).map((color) => ({
                  value: color,
                  label: convertCamelCaseToSpacedWords(color),
                }))}
                onChange={(option) => {
                  setChangedRedlineSettings({
                    ...changedRedlineSettings,
                    deletedColor: option.value,
                  });
                }}
                display={convertCamelCaseToSpacedWords(
                  changedRedlineSettings.deletedColor,
                )}
              />
            </div>
            <div className={css.section}>
              <div className={sharedCss.sectionTitle}>Highlight Change</div>
              <SegmentedSwitch
                selectedValue={changedRedlineSettings.granularity}
                options={[
                  {
                    value: 'WordLevel',
                    label: 'Word',
                  },
                  {
                    value: 'CharacterLevel',
                    label: 'Character',
                  },
                ]}
                onClick={(option) => {
                  setChangedRedlineSettings({
                    ...changedRedlineSettings,
                    granularity: option.value,
                  });
                }}
              />
            </div>
            <div className={css.section}>
              <div className={sharedCss.sectionTitle}>Comparison Options</div>
              <div className={css.checkboxContainer}>
                {[
                  { label: 'Formatting', key: 'compareFormatting' },
                  { label: 'Case changes', key: 'compareCaseChanges' },
                  { label: 'White space', key: 'compareWhitespace' },
                  { label: 'Tables', key: 'compareTables' },
                  { label: 'Headers', key: 'compareHeaders' },
                  { label: 'Footnotes', key: 'compareFootnotes' },
                  { label: 'Textboxes', key: 'compareTextboxes' },
                  { label: 'Fields', key: 'compareFields' },
                  { label: 'Comments', key: 'compareComments' },
                  { label: 'Moves', key: 'compareMoves' },
                ].map(({ label, key }) => (
                  <DiffCheckbox<boolean>
                    key={key}
                    label={label}
                    currentValue={Boolean(
                      changedRedlineSettings[
                        key as keyof RedlineOutputSettingsObject
                      ],
                    )}
                    onValue={true}
                    offValue={false}
                    onClick={(value) =>
                      setChangedRedlineSettings({
                        ...changedRedlineSettings,
                        [key]: value,
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <Button
              style="primary"
              tone="green"
              size="large"
              onClick={() => {
                if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
                  window.ipcRenderer.send(
                    ipcEvents.APP__REDLINE_CLOSE_WORD_PROCESS,
                  );
                }
                setLastAppliedRedlineSettings(changedRedlineSettings);
                handleRedlineSettingsChange(changedRedlineSettings);
              }}
              fullWidth={true}
              disabled={
                JSON.stringify(changedRedlineSettings) ===
                JSON.stringify(lastAppliedRedlineSettings)
              }
            >
              Apply Changes
            </Button>
          </>
        )}
        {selectedTab === 'summary' && revisionSummary && (
          <div className={css.summaryContainer}>
            {redlineDiffedAt && (
              <div>
                <h1>Comparison done</h1>
                <h2>{formatDateObject(redlineDiffedAt)}</h2>
              </div>
            )}
            <div>
              <h1>Original file</h1>
              <h2>{leftFilePath}</h2>
            </div>
            <div>
              <h1>Modified file</h1>
              <h2>{rightFilePath}</h2>
            </div>
            <RevisionSummaryItem
              sectionStatType={revisionSummary.text}
              section="Text"
            />
            <RevisionSummaryItem
              sectionStatType={revisionSummary.headerFooter}
              section="Header/Footer"
            />
            <RevisionSummaryItem
              sectionStatType={revisionSummary.tables}
              section="Table"
            />
            <RevisionSummaryItem
              sectionStatType={revisionSummary.formatting}
              section="Formatting"
            />
            <RevisionSummaryItem
              sectionStatType={revisionSummary.totals}
              section="Total"
            />
          </div>
        )}
      </div>
    </PdfSidebar>
  );
};

const RedlineTopToolbar = ({
  redlineViewType,
  setRedlineViewType,
  redlineZoomType,
  setRedlineZoomType,
}: {
  redlineViewType: RedlineViewType;
  setRedlineViewType: (value: RedlineViewType) => void;
  redlineZoomType: ZoomTypeOption;
  setRedlineZoomType: (value: ZoomTypeOption) => void;
}) => {
  const handleChangeViewType = (viewType: RedlineViewType) => {
    window.ipcRenderer.send(ipcEvents.APP__REDLINE_CHANGE_VIEW_TYPE, viewType);
    setRedlineViewType(viewType);
  };

  const handleChangePage = (direction: RedlinePageChangeDirection) => {
    window.ipcRenderer.send(ipcEvents.APP__REDLINE_CHANGE_PAGE, direction);
  };

  const handleOpenZoomMenu = () => {
    window.ipcRenderer.send(
      ipcEvents.APP__REDLINE_OPEN_ZOOM_MENU,
      redlineZoomType,
    );
  };

  React.useEffect(() => {
    const handleZoomChange = (_event: Event, zoomType: ZoomTypeOption) => {
      setRedlineZoomType(zoomType);
    };

    window.ipcRenderer.on(
      ipcEvents.APP__REDLINE_ZOOM_CHANGE_RESPONSE,
      handleZoomChange,
    );

    return () => {
      window.ipcRenderer.removeListener(
        ipcEvents.APP__REDLINE_ZOOM_CHANGE_RESPONSE,
        handleZoomChange,
      );
    };
  }, [setRedlineZoomType]);

  return (
    <div className={css.redlineToolbar}>
      <div className={sharedCss.tabs}>
        <Tab
          label="Redline"
          selectTab={() => handleChangeViewType(RedlineViewType.REDLINE)}
          isSelected={redlineViewType === RedlineViewType.REDLINE}
        />
        <Tab
          label="Original"
          selectTab={() => handleChangeViewType(RedlineViewType.ORIGINAL)}
          isSelected={redlineViewType === RedlineViewType.ORIGINAL}
        />
        <Tab
          label="Changed"
          selectTab={() => handleChangeViewType(RedlineViewType.CHANGED)}
          isSelected={redlineViewType === RedlineViewType.CHANGED}
        />
      </div>
      <div className={css.pageControls}>
        <IconButton
          svg={ArrowUpSvg}
          style="secondary"
          size="small"
          tone="base"
          onClick={() => handleChangePage(RedlinePageChangeDirection.UP)}
        />
        <IconButton
          svg={ArrowDownSvg}
          style="secondary"
          size="small"
          tone="base"
          onClick={() => handleChangePage(RedlinePageChangeDirection.DOWN)}
        />
        <div
          className={cx(dropdownCss.root, css.zoomDropdown, dropdownCss.text)}
        >
          <Button
            style="clean"
            className={cx(dropdownCss.buttonControl, css.zoomDropdownButton)}
            onClick={handleOpenZoomMenu}
          >
            <span className={dropdownCss.buttonText}>
              {redlineZoomType.label}
            </span>
            <Icon svg={ChevronDownSvg} size="small" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const RedlineBottomToolbar = ({
  redlinePdf,
  redlineWordDoc,
}: {
  redlinePdf?: PdfConversionResult;
  redlineWordDoc?: WordDocumentInfo;
}) => {
  const exportAsPdfText = t('DiffEditorHeader.exportAsPdf');
  const [isPendingPdfExport, setIsPendingPdfExport] = React.useState(false);
  const [isPendingWordExport, setIsPendingWordExport] = React.useState(false);

  /**
   * Handles PDF export button click:
   * - If PDF is ready, exports immediately
   * - If PDF is not ready, set the pending export state
   */
  const handlePdfExport = () => {
    if (redlinePdf) {
      const fileName = redlinePdf.documentInfo?.fileName.replace(
        /\.[^/.]+$/,
        '.pdf',
      );
      window.ipcRenderer.send(ipcEvents.APP__SAVE_FILE, [
        {
          data: new Uint8Array(redlinePdf.data),
          fileName,
        },
      ]);
      Tracking.trackEvent('Downloaded redline diff', {
        downloadType: 'pdf',
      });
    } else {
      setIsPendingPdfExport(true);
    }
  };

  /**
   * Handles Word export button click:
   * - If Word doc is ready, exports immediately
   * - If Word doc is not ready, set the pending export state
   */
  const handleWordExport = () => {
    if (redlineWordDoc) {
      window.ipcRenderer.send(ipcEvents.APP__SAVE_FILE, [
        {
          data: new Uint8Array(redlineWordDoc.data),
          fileName: redlineWordDoc.fileName,
        },
      ]);
      Tracking.trackEvent('Downloaded redline diff', {
        downloadType: 'word',
      });
    } else {
      setIsPendingWordExport(true);
    }
  };

  /**
   * Perform any pending exports once the PDF is ready
   */
  React.useEffect(() => {
    if (redlinePdf && isPendingPdfExport) {
      setIsPendingPdfExport(false);
      handlePdfExport();
    }
  }, [redlinePdf]);

  /**
   * Perform any pending exports once the Word doc is ready
   */
  React.useEffect(() => {
    if (redlineWordDoc && isPendingWordExport) {
      setIsPendingWordExport(false);
      handleWordExport();
    }
  }, [redlineWordDoc]);

  return (
    <div className={css.redlineBottomToolbar}>
      <div>
        {isPendingPdfExport ? (
          <Button
            style="clean"
            className={cx(css.exportButton, css.buttonDisabled)}
            disabled
          >
            <LoadingCircle style="secondary" size="xs" />
            <div className={cx(css.exportButtonText, css.textDisabled)}>
              {exportAsPdfText}
            </div>
          </Button>
        ) : (
          <Button
            style="clean"
            className={css.exportButton}
            iconStartSvg={UploadSvg}
            onClick={handlePdfExport}
          >
            <div className={css.exportButtonText}>{exportAsPdfText}</div>
          </Button>
        )}
      </div>
      <div>
        {isPendingWordExport ? (
          <Button
            style="clean"
            className={cx(css.exportButton, css.buttonDisabled)}
            disabled
          >
            <LoadingCircle style="secondary" size="xs" />
            <div className={cx(css.exportButtonText, css.textDisabled)}>
              Export as Word
            </div>
          </Button>
        ) : (
          <Button
            style="clean"
            className={css.exportButton}
            iconStartSvg={UploadSvg}
            onClick={handleWordExport}
          >
            <div className={css.exportButtonText}>Export as Word</div>
          </Button>
        )}
      </div>
    </div>
  );
};

const RevisionSummaryItem = ({
  sectionStatType,
  section,
}: {
  sectionStatType: Partial<RevisionSummarySectionStats>;
  section: string;
}) => {
  const {
    total: totalCount,
    insert: insertCount,
    delete: deleteCount,
    movesTo: movesToCount,
    movesFrom: movesFromCount,
  } = sectionStatType;

  return (
    <div className={css.summaryItem}>
      <h1 className={css.sectionTitle}>{section}</h1>
      {section !== 'Formatting' && (
        <>
          <p>
            {section} insertions: {insertCount}
          </p>
          <p>
            {section} deletions: {deleteCount}
          </p>
          <p>
            {section} moves to: {movesToCount}
          </p>
          <p>
            {section} moves from: {movesFromCount}
          </p>
        </>
      )}

      <p>
        {section}{' '}
        {section === 'Formatting' || section === 'Total' ? 'changes' : 'total'}:{' '}
        {totalCount}
      </p>
    </div>
  );
};

export default RedlineOutputContainer;
