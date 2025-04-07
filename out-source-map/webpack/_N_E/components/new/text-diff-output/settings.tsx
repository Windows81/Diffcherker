import cx from 'classnames';
import Button from 'components/shared/button';
import Icon from 'components/shared/icon';
import ArrowDownSvg from 'components/shared/icons/arrow-down.svg';
import MergeSvg from 'components/shared/icons/merge.svg';
import UploadSvg from 'components/shared/icons/upload.svg';
import UploadExcelSvg from 'components/shared/icons/upload-excel.svg';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import { MutableRefObject, useContext, useMemo, useState } from 'react';
import { DiffInputType } from 'types/diff-input-type';

import DiffCollapsedToggle from '../diff-collapsed-toggle';
import DiffLevelSwitch from '../diff-level-switch';
import DiffRealtimeToggle from '../diff-realtime-toggle';
import css from './settings.module.css';
import DiffUnifiedToggle from '../diff-unified-toggle';

import { createNextState } from '@reduxjs/toolkit';
import { usePdfExport, usePdfIsExporting } from 'lib/state/pdfExport';
import { type DiffLevel } from 'types/normalize';
import { DiffType } from 'redux/modules/user-module';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { DiffCompression } from 'types/diffCompression';
import stringReplaceAll from 'string-replace-all';
import { DiffVersion } from 'types/diffVersion';
import SyntaxHighlightDropdown from '../syntax-highlight-dropdown';
import TextDiffOutputContext, { TextDiffOutputApi } from './context';
import { DiffFeature } from 'lib/diff-features';
import { getDiff } from 'redux/selectors/diff-selector';
import { Diff } from 'types/diff';

export const defaultTextDiffOutputSettings: TextDiffOutputSettingsObject = {
  diffVersion: 'regular',
  diffType: 'split',
  diffCompression: 'expanded',
  diffLevel: 'word',
  syntaxHighlight: '',
};

export type TextDiffOutputSettingsObject = {
  diffVersion: DiffVersion;
  diffType: DiffType;
  diffCompression: DiffCompression;
  diffLevel: DiffLevel;
  syntaxHighlight: string;
};

type TextDiffOutputSettingsProps = {
  settings: TextDiffOutputSettingsObject;
  apiRef?: MutableRefObject<TextDiffOutputApi>;
  onSettingsChange: (newSettings: TextDiffOutputSettingsObject) => void;
  diffInputType?: DiffInputType;
  allowMerge?: boolean;
  allowRealtimeDiff?: boolean;
  allowSyntaxHighlighting?: boolean;
  allowSkipToEditor?: boolean;
  diff?: Diff;
};

const TextDiffOutputSettings: React.FC<TextDiffOutputSettingsProps> = ({
  settings,
  apiRef: propsApiRef,
  onSettingsChange,
  diffInputType = DiffInputType.TEXT,
  allowMerge,
  allowRealtimeDiff,
  allowSyntaxHighlighting,
  allowSkipToEditor,
  diff,
}) => {
  const { api: contextApi } = useContext(TextDiffOutputContext);
  const isPro = useAppSelector(isProUser);

  // if diff prop is passed, it means that this diff is a document diff
  // and we will use that to replace currentDiff.
  const diffFromStore = useAppSelector(getDiff);
  const currentDiff = diff || diffFromStore;

  const [localSettings, setLocalSettings] =
    useState<TextDiffOutputSettingsObject>(defaultTextDiffOutputSettings);

  /**
   * Allows the use of the settings outside of the TextDiffOutput component
   * context.
   */
  const apiRef = useMemo(() => {
    return propsApiRef ?? { current: contextApi };
  }, [contextApi, propsApiRef]);

  /**
   * Controlled vs uncontrolled
   */
  settings = !!settings ? settings : localSettings;
  onSettingsChange = !!onSettingsChange ? onSettingsChange : setLocalSettings;

  const { diffVersion, diffType, diffCompression, diffLevel, syntaxHighlight } =
    settings;

  const isTextDiff = diffInputType === DiffInputType.TEXT;
  const isLiveDiff = diffVersion === 'live';
  const isCompressionCollapsed = diffCompression === 'collapsed';

  //TODO: Refactor this JOTAI out :\
  const isPdfExporting = usePdfIsExporting();
  const exportPdf = usePdfExport();

  const checkIfFeatureAllowed = (feature: DiffFeature) => {
    return apiRef.current.checkFeatureUsage(feature);
  };

  //TODO: Callback handler?
  const handleExportPdf = (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (checkIfFeatureAllowed(DiffFeature.EXPORT_TEXT_DIFF_PDF)) {
      ev.preventDefault();
      Tracking.trackEvent('Exported diff', {
        diffInputType: DiffInputType.TEXT,
        fileType: 'pdf',
      });
      exportPdf();
    }
  };

  const handleExportXlsx = async () => {
    if (checkIfFeatureAllowed(DiffFeature.EXPORT_TEXT_DIFF_XLSX)) {
      const { exportToExcel } = await import('./commands/text-export-to-xlsx');
      if (currentDiff.blocks && currentDiff.rows) {
        const blockRowsList = currentDiff.blocks.map((block) =>
          currentDiff
            .rows!.slice(block.lineStart, block.lineEnd + 1)
            .map((row, index) => ({
              data: row,
              index: block.lineStart + index,
            })),
        );
        Tracking.trackEvent('Exported diff', {
          diffInputType: DiffInputType.TEXT,
          fileType: 'xlsx',
        });

        exportToExcel(blockRowsList, currentDiff.title);
      }
    }
  };

  const trackToggleClick = (diffToggle: string) => {
    Tracking.trackEvent('Clicked diff toggle', {
      diffInputType,
      diffToggle,
      isPro,
    });
  };

  return (
    <div className={css.containerForSidebar}>
      <div className={css.settings}>
        <div className={css.toggleSection}>
          {isTextDiff && allowRealtimeDiff && (
            <DiffRealtimeToggle
              value={diffVersion}
              handleChange={(newDiffVersion) =>
                onSettingsChange(
                  createNextState(settings, (draft) => {
                    draft.diffVersion = newDiffVersion;
                  }),
                )
              }
              onClick={() => trackToggleClick('version')}
              disabled={isCompressionCollapsed}
              checkIfAllowed={() => checkIfFeatureAllowed(DiffFeature.REALTIME)}
            />
          )}
          <DiffUnifiedToggle
            value={diffType}
            onClick={() => trackToggleClick('unified')}
            handleChange={(diffType) =>
              onSettingsChange(
                createNextState(settings, (draft) => {
                  draft.diffType = diffType;
                }),
              )
            }
            checkIfAllowed={() => checkIfFeatureAllowed(DiffFeature.UNIFIED)}
          />
          <DiffCollapsedToggle
            value={diffCompression}
            onClick={() => trackToggleClick('collapsed')}
            disabled={isLiveDiff}
            handleChange={(diffCompression) =>
              onSettingsChange(
                createNextState(settings, (draft) => {
                  draft.diffCompression = diffCompression;
                }),
              )
            }
            checkIfAllowed={() => checkIfFeatureAllowed(DiffFeature.COLLAPSED)}
          />
        </div>

        <div className={css.section}>
          <div
            className={cx(css.sectionTitle, {
              [css.roomForProBadge]: !isPro,
              [css.disabled]: isLiveDiff,
            })}
          >
            Highlight change
          </div>
          <div className={cx(css.proWrapper, css.mediumRadius)}>
            <DiffLevelSwitch
              value={diffLevel}
              onClick={() => trackToggleClick('level')}
              disabled={isLiveDiff}
              handleChange={(diffLevel) =>
                onSettingsChange(
                  createNextState(settings, (draft) => {
                    draft.diffLevel = diffLevel;
                  }),
                )
              }
            />
          </div>
        </div>

        {isTextDiff && allowSyntaxHighlighting && (
          <div className={css.section}>
            <div
              className={cx(css.sectionTitle, {
                [css.roomForProBadge]: !isPro,
              })}
            >
              Syntax highlighting
            </div>
            <div className={cx(css.proWrapper, css.mediumRadius)}>
              <SyntaxHighlightDropdown
                value={syntaxHighlight}
                handleChange={(syntaxHighlight) =>
                  onSettingsChange(
                    createNextState(settings, (draft) => {
                      draft.syntaxHighlight = syntaxHighlight;
                    }),
                  )
                }
                checkIfAllowed={() =>
                  checkIfFeatureAllowed(DiffFeature.SYNTAX_HIGHLIGHT)
                }
              />
            </div>
          </div>
        )}

        <div className={css.section}>
          <div className={css.sectionTitle}>
            {t('AdvancedDiffDropdown.placeholder')}
          </div>
          <div className={css.buttonContainer}>
            <DiffSettingsButton
              label={t('AdvancedDiffDropdown.toLowerCase')}
              onClick={() => {
                Tracking.trackEvent('Clicked advanced diff option', {
                  advancedDiffOption: 'toLowercase',
                });
                apiRef.current.toLowercase();
              }}
            />
            <DiffSettingsButton
              label={t('AdvancedDiffDropdown.sortLines')}
              onClick={() => {
                Tracking.trackEvent('Clicked advanced diff option', {
                  advancedDiffOption: 'sortLines',
                });
                apiRef.current.sortLines();
              }}
            />
            <DiffSettingsButton
              label={t('AdvancedDiffDropdown.replaceLineBreaksWithSpaces')}
              onClick={() => {
                Tracking.trackEvent('Clicked advanced diff option', {
                  advancedDiffOption: 'replaceLineBreaksWithSpaces',
                });
                apiRef.current.toSpaces();
              }}
            />
            <DiffSettingsButton
              label={t('AdvancedDiffDropdown.trimWhitespace')}
              onClick={() => {
                Tracking.trackEvent('Clicked advanced diff option', {
                  advancedDiffOption: 'trimWhitespace',
                });
                apiRef.current.trimWhitespace();
              }}
            />
          </div>
        </div>

        {isTextDiff && (
          <>
            <div className={css.section}>
              <div className={css.buttonContainer}>
                {allowMerge && (
                  <DiffSettingsButton
                    label={t('DiffEditorHeader.compareAndMerge')}
                    iconSvg={MergeSvg}
                    disabled={isLiveDiff}
                    onClick={() => {
                      Tracking.trackEvent('Started diff merge');
                      apiRef.current.selectFirstMergeBlock();
                    }}
                  />
                )}
                <DiffSettingsButton
                  label={t('DiffEditorHeader.exportAsPdf')}
                  iconSvg={UploadSvg}
                  isLoading={isPdfExporting}
                  disabled={isLiveDiff}
                  onClick={handleExportPdf}
                />
                <DiffSettingsButton
                  label={t('DiffEditorHeader.exportAsExcel')}
                  iconSvg={UploadExcelSvg}
                  disabled={isLiveDiff}
                  onClick={handleExportXlsx}
                />
              </div>
            </div>
            {allowSkipToEditor && (
              <div className={css.section}>
                <div className={css.buttonContainer}>
                  <DiffSettingsButton
                    label={t('DiffEditorHeader.editor')}
                    iconSvg={ArrowDownSvg}
                    disabled={isLiveDiff}
                    onClick={() => {
                      const editor = document.getElementById('editor');
                      editor?.scrollIntoView();
                      Tracking.trackEvent('Clicked diff button', {
                        diffButton: 'editor',
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export interface DiffSettingsButtonProps {
  label: string;
  iconSvg?: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  isLoading?: boolean;
}

export const DiffSettingsButton: React.FC<DiffSettingsButtonProps> = ({
  label,
  iconSvg,
  onClick,
  disabled,
  isLoading,
}) => {
  return (
    <Button
      style="clean"
      onClick={onClick}
      className={css.settingsButton}
      disabled={disabled}
      data-testid={`settings-${stringReplaceAll(label, ' ', '-').toLowerCase()}-button`}
    >
      {!!iconSvg && <Icon size="small" svg={iconSvg} />}
      <span className={css.label}>{label}</span>
      {
        !!isLoading // TODO loading animation
      }
    </Button>
  );
};

export default TextDiffOutputSettings;
