import React, { useState } from 'react';
import css from './excel-input-settings.module.css';
import DiffCheckbox from 'components/new/diff-checkbox';
import Button from 'components/shared/button';
import { useProfiles, Profile } from 'lib/state/profiles';
import {
  ExcelDiffLevel,
  ExcelDiffOutputSettingsObject,
} from './new/excel-diff/excel-output/types';
import { DiffInputType } from 'types/diff-input-type';
import { ExcelDiffOutputTypes } from 'lib/output-types';
import SegmentedSwitch from './shared/segmented-switch';

const ExcelInputSettings: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [profiles, setProfiles] = useProfiles();
  const currentProfile = profiles.find(
    (profile: Profile) => profile.name === 'Default',
  );

  const excelDiffConfig =
    currentProfile.configurations[DiffInputType.EXCEL][
      ExcelDiffOutputTypes.Table
    ];

  // Will need to make this more dynamic once/if we add plain text excel diff settings
  const [changedExcelDiffSettings, setChangedExcelDiffSettings] =
    useState<ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table]>(
      excelDiffConfig,
    );

  const handleApplyChanges = () => {
    // Update the profile's configuration with new settings
    if (currentProfile) {
      const updatedProfiles = profiles.map((profile: Profile) => {
        if (profile.name === currentProfile.name) {
          return {
            ...profile,
            configurations: {
              ...profile.configurations,
              [DiffInputType.EXCEL]: {
                ...profile.configurations[DiffInputType.EXCEL],
                [ExcelDiffOutputTypes.Table]: changedExcelDiffSettings,
              },
            },
          };
        }
        return profile;
      });
      setProfiles(updatedProfiles);
      onClose();
    }
  };

  return (
    <div className={css.section}>
      <div className={css.sectionTitle}>Comparison Options</div>
      <div className={css.comparisonOptions}>
        <SegmentedSwitch
          selectedValue={changedExcelDiffSettings['diffLevel']}
          options={[
            { label: 'Standard', value: 'standard' },
            { label: 'Formulas', value: 'formulas' },
          ]}
          onClick={(option) => {
            setChangedExcelDiffSettings({
              ...changedExcelDiffSettings,
              diffLevel: option.value as ExcelDiffLevel,
            });
          }}
        />
        <div className={css.checkboxContainer}>
          {[
            { label: 'Ignore white space', key: 'compareWhitespace' },
            { label: 'Ignore case changes', key: 'compareCaseChanges' },
            {
              label: 'Hide unchanged rows',
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
            />
          ))}
        </div>

        <Button
          style="primary"
          tone="green"
          size="large"
          onClick={() => {
            handleApplyChanges();
          }}
          disabled={
            JSON.stringify(changedExcelDiffSettings) ===
            JSON.stringify(excelDiffConfig?.[ExcelDiffOutputTypes.Table])
          }
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

export default ExcelInputSettings;
