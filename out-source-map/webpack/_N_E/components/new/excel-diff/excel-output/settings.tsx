import { MutableRefObject, useContext, useMemo, useState } from 'react';
import { t } from 'lib/react-tiny-i18n';
import { DiffSettingsButton } from '../../text-diff-output/settings';
import css from '../../excel-diff-sidebar.module.css';
import Tracking from 'lib/tracking';
import ExcelDiffOutputContext, { ExcelDiffOutputApi } from './context';
import { ExcelTransformationType } from './excel-transformations';
import DiffCheckbox from '../../diff-checkbox';
import Button from 'components/shared/button';
import { ExcelDiffOutputTypes } from 'lib/output-types';
import { ExcelDiffLevel, ExcelDiffOutputSettingsObject } from './types';
import SegmentedSwitch from 'components/shared/segmented-switch';

interface ExcelDiffOutputSettingsProps {
  apiRef?: MutableRefObject<ExcelDiffOutputApi>;
  excelDiffOutputSettings: ExcelDiffOutputSettingsObject;
  setExcelDiffOutputSettings: (settings: ExcelDiffOutputSettingsObject) => void;
  findDifference: () => void;
  clearResult: () => void;
  currentType: ExcelDiffOutputTypes;
}

const ExcelDiffOutputSettings: React.FC<ExcelDiffOutputSettingsProps> = ({
  apiRef: propsApiRef,
  excelDiffOutputSettings,
  setExcelDiffOutputSettings,
  findDifference,
  clearResult,
  currentType,
}) => {
  const { api: contextApi } = useContext(ExcelDiffOutputContext);

  const apiRef = useMemo(() => {
    return propsApiRef ?? { current: contextApi };
  }, [contextApi, propsApiRef]);

  const [changedExcelDiffSettings, setChangedExcelDiffSettings] = useState<
    ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table]
  >(excelDiffOutputSettings[ExcelDiffOutputTypes.Table]);
  const [lastAppliedExcelDiffSettings, setLastAppliedExcelDiffSettings] =
    useState<ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table]>(
      excelDiffOutputSettings[ExcelDiffOutputTypes.Table],
    );

  const handleApplyChanges = () => {
    setExcelDiffOutputSettings({
      [ExcelDiffOutputTypes.Table]: changedExcelDiffSettings,
    });
    setLastAppliedExcelDiffSettings(changedExcelDiffSettings);
    findDifference();
  };

  function trackExcelSettingsChanges(
    changedExcelDiffSettings: ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table],
  ) {
    for (const key in changedExcelDiffSettings) {
      if (
        changedExcelDiffSettings[
          key as keyof ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table]
        ]
      ) {
        Tracking.trackEvent('Apply changes to excel diff settings', {
          excelDiffOption: key,
          settings: changedExcelDiffSettings,
        });
      }
    }
  }

  return (
    <div className={css.containerForSidebar}>
      <div className={css.settings}>
        {currentType === ExcelDiffOutputTypes.Table && (
          <div className={css.section}>
            <>
              <div className={css.sectionTitle}>
                {t('ExcelDiffDropdown.comparisonOptions')}
              </div>
              <div className={css.comparisonOptions}>
                <SegmentedSwitch
                  selectedValue={changedExcelDiffSettings['diffLevel']}
                  options={[
                    { label: 'Standard', value: 'standard' },
                    { label: 'Formulas', value: 'formulas' },
                  ]}
                  onClick={(option) => {
                    Tracking.trackEvent('Clicked excel diff option', {
                      excelDiffOption: 'diffLevel',
                    });
                    setChangedExcelDiffSettings({
                      ...changedExcelDiffSettings,
                      diffLevel: option.value as ExcelDiffLevel,
                    });
                  }}
                />
                <div className={css.checkboxContainer}>
                  {[
                    {
                      label: t('ExcelDiffDropdown.ignoreWhiteSpace'),
                      key: 'compareWhitespace',
                    },
                    {
                      label: t('ExcelDiffDropdown.ignoreCaseChanges'),
                      key: 'compareCaseChanges',
                    },
                    {
                      label: t('ExcelDiffDropdown.hideUnchangedRows'),
                      key: 'compareUnchangedRows',
                    },
                  ].map(({ label, key }) => (
                    <DiffCheckbox<boolean>
                      key={key}
                      label={label}
                      currentValue={Boolean(
                        changedExcelDiffSettings[
                          key as keyof ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table]
                        ],
                      )}
                      onValue={true}
                      offValue={false}
                      onClick={(value) => {
                        setChangedExcelDiffSettings({
                          ...changedExcelDiffSettings,
                          [key]: value,
                        });
                      }}
                      className={css.checkbox}
                    />
                  ))}
                </div>

                <Button
                  style="primary"
                  tone="green"
                  size="large"
                  onClick={() => {
                    trackExcelSettingsChanges(changedExcelDiffSettings);
                    clearResult();
                    handleApplyChanges();
                  }}
                  disabled={
                    JSON.stringify(changedExcelDiffSettings) ===
                    JSON.stringify(lastAppliedExcelDiffSettings)
                  }
                >
                  {t('ExcelDiffDropdown.applyChanges')}
                </Button>
              </div>
            </>
          </div>
        )}

        <div className={css.section}>
          <div className={css.sectionTitle}>{t('ExcelDiffDropdown.tools')}</div>
          <div className={css.buttonContainer}>
            <DiffSettingsButton
              label={t('ExcelDiffDropdown.sortRows')}
              onClick={() => {
                Tracking.trackEvent('Clicked excel diff option', {
                  excelDiffOption: 'sortRows',
                });
                apiRef.current.applyTransformation(
                  ExcelTransformationType.SortRows,
                );
              }}
            />
            <DiffSettingsButton
              label={t('ExcelDiffDropdown.sortColumns')}
              onClick={() => {
                Tracking.trackEvent('Clicked excel diff option', {
                  excelDiffOption: 'sortColumns',
                });
                apiRef.current.applyTransformation(
                  ExcelTransformationType.SortColumns,
                );
              }}
            />
            <DiffSettingsButton
              label={'Normalize dates (US)'}
              onClick={() => {
                Tracking.trackEvent('Clicked excel diff option', {
                  excelDiffOption: 'normalizeDatesUS',
                });
                apiRef.current.applyTransformation(
                  ExcelTransformationType.NormalizeDatesUS,
                );
              }}
            />
            <DiffSettingsButton
              label={'Normalize dates (EU)'}
              onClick={() => {
                Tracking.trackEvent('Clicked excel diff option', {
                  excelDiffOption: 'normalizeDatesEU',
                });
                apiRef.current.applyTransformation(
                  ExcelTransformationType.NormalizeDatesEU,
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelDiffOutputSettings;
