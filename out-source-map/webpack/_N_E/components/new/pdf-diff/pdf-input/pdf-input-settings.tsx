import {
  RedlineOutputSettingsObject,
  FontColorOptions,
} from 'components/new/redline-output/settings';
import React, { useState } from 'react';
import css from './pdf-input-settings.module.css';
import sharedCss from '../pdf-output/pdf-output-shared.module.css';
import Dropdown from 'components/shared/dropdown';
import SegmentedSwitch from 'components/shared/segmented-switch';
import DiffCheckbox from 'components/new/diff-checkbox';
import Button from 'components/shared/button';
import { useProfiles, Profile } from 'lib/state/profiles';
import { PdfDiffOutputTypes } from 'lib/output-types';
import { DiffInputType } from 'types/diff-input-type';

const PdfInputSettings: React.FC<{
  profileName: string;
  onClose: () => void;
}> = ({ profileName, onClose }) => {
  const [isInsertionDropdownOpen, setIsInsertionDropdownOpen] = useState(false);
  const [isDeletedDropdownOpen, setIsDeletedDropdownOpen] = useState(false);
  const [profiles, setProfiles] = useProfiles();
  const currentProfile = profiles.find(
    (profile: Profile) => profile.name === profileName,
  );
  const redlineConfig =
    currentProfile.configurations[DiffInputType.PDF][
      PdfDiffOutputTypes.Redline
    ];
  const [changedRedlineSettings, setChangedRedlineSettings] =
    useState<RedlineOutputSettingsObject>(redlineConfig);

  const convertCamelCaseToSpacedWords = (camelCaseString: string): string => {
    return camelCaseString.replace(/([A-Z])/g, ' $1').trim();
  };

  const handleApplyChanges = () => {
    // Update the profile's configuration with new settings
    if (currentProfile) {
      const updatedProfiles = profiles.map((profile: Profile) => {
        if (profile.name === profileName) {
          return {
            ...profile,
            configurations: {
              ...profile.configurations,
              [DiffInputType.PDF]: {
                ...profile.configurations[DiffInputType.PDF],
                [PdfDiffOutputTypes.Redline]: changedRedlineSettings,
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
    <div className={css.sidebarContent}>
      <>
        <div className={css.section}>
          <div className={sharedCss.sectionTitle}>Insertion Color</div>
          <Dropdown<string>
            isOpen={isInsertionDropdownOpen}
            setIsOpen={(value: boolean) => setIsInsertionDropdownOpen(value)}
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
      </>
      <Button
        style="primary"
        tone="green"
        size="large"
        onClick={() => {
          handleApplyChanges();
        }}
        fullWidth={true}
        disabled={
          JSON.stringify(changedRedlineSettings) ===
          JSON.stringify(redlineConfig)
        }
      >
        Apply Changes
      </Button>
    </div>
  );
};

export default PdfInputSettings;
