import Dropdown from 'components/shared/dropdown';
import { useState, SetStateAction } from 'react';
import Tab from 'components/shared/tab';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import SegmentedSwitch from 'components/shared/segmented-switch';
import { DiffLevel } from 'types/normalize';
import { type Option } from 'types/option';
import css from './configure-dropdown.module.css';
import DiffCheckbox from 'components/new/diff-checkbox';
import DiffToggle from 'components/new/diff-toggle';
import LockedChainSVG from 'components/shared/icons/locked-chain.svg';
import UnlockedChainSVG from 'components/shared/icons/unlocked-chain.svg';
import LetterCircleSVG from 'components/shared/icons/letter-circle.svg';
import arrowRightCircleSVG from 'components/shared/icons/arrow-right-circle.svg';
import { t } from 'lib/react-tiny-i18n';

interface ConfigureDropdownProps {
  richTextFormattingChanges: boolean;
  richTextShowMoves: boolean;
  richTextShowFontFamilyChanges: boolean;
  richTextShowFontSizeChanges: boolean;
  richTextShowColorChanges: boolean;
  textDiffLevelOptions: Option<DiffLevel>[];
  richTextDiffLevel: DiffLevel;
  isScrollLocked: boolean;
  changeRichTextDiffLevel: (level: DiffLevel) => void;
  changeRichTextShowMoves: (value: boolean) => void;
  setRichTextFormattingChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowColorChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowFontFamilyChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowFontSizeChanges: (value: SetStateAction<boolean>) => void;
  setIsScrollLocked: (value: SetStateAction<boolean>) => void;
}

const ConfigureDropdown: React.FC<ConfigureDropdownProps> = ({
  richTextFormattingChanges,
  richTextShowMoves,
  richTextShowFontFamilyChanges,
  richTextShowFontSizeChanges,
  richTextShowColorChanges,
  textDiffLevelOptions,
  richTextDiffLevel,
  isScrollLocked,
  changeRichTextDiffLevel,
  changeRichTextShowMoves,
  setRichTextFormattingChanges,
  setRichTextShowColorChanges,
  setRichTextShowFontFamilyChanges,
  setRichTextShowFontSizeChanges,
  setIsScrollLocked,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownProps = {
    display: (
      <Tab
        svg={PreferencesSvg}
        label={t('PdfDiff.richText.configureButton')}
        className={css.tab}
      />
    ),
    buttonClassName: css.button,
    buttonOpenClassName: css.open,
  };

  return (
    <div className={css.configureDropdown}>
      <Dropdown
        isOpen={isOpen}
        setIsOpen={(newState) => {
          setIsOpen(newState);
        }}
        onChange={() => undefined}
        closeDropdownOnClick={false}
        maxHeight={500}
        rightAlign
        {...dropdownProps}
      >
        <div className={css.sidebarContent}>
          <div className={css.sidebarSection}>
            <div className={css.sidebarSectionTitle}>Highlight Change</div>
            <SegmentedSwitch
              selectedValue={richTextDiffLevel}
              options={textDiffLevelOptions}
              onClick={(option) => {
                changeRichTextDiffLevel(option.value);
              }}
            />
          </div>
          <div className={css.sidebarSection}>
            <div className={css.sidebarSectionTitle}>View</div>
            <div className={css.sidebarNestedGreySection}>
              <DiffToggle<boolean>
                label={t('PdfDiff.richText.synchronizeScroll')}
                currentValue={isScrollLocked}
                onValue={true}
                offValue={false}
                onClick={(value) => {
                  setIsScrollLocked(value);
                }}
                icon={isScrollLocked ? LockedChainSVG : UnlockedChainSVG}
                iconClassName={css.scrollIcon}
              />
            </div>
          </div>
          <div className={css.sidebarSection}>
            <div className={css.sidebarSectionTitle}>
              {t('PdfDiff.richText.changes')}
            </div>
            <div className={css.sidebarNestedGreySection}>
              <DiffCheckbox<boolean>
                label={t('PdfDiff.richText.formattingChanges')}
                currentValue={richTextFormattingChanges}
                onValue={true}
                offValue={false}
                onClick={(value) => {
                  setRichTextFormattingChanges(value);
                }}
                icon={LetterCircleSVG}
                iconClassName={css.formattingChangesIcon}
              />
              <DiffCheckbox<boolean>
                label={t('PdfDiff.richText.fontStyle')}
                currentValue={richTextShowFontFamilyChanges}
                onValue={true}
                offValue={false}
                onClick={(value) => {
                  setRichTextShowFontFamilyChanges(value);
                }}
                className={css.richTextFormattingContent}
                disabled={!richTextFormattingChanges}
              />
              <DiffCheckbox<boolean>
                label={t('PdfDiff.richText.fontSize')}
                currentValue={richTextShowFontSizeChanges}
                onValue={true}
                offValue={false}
                onClick={(value: boolean) => {
                  setRichTextShowFontSizeChanges(value);
                }}
                className={css.richTextFormattingContent}
                disabled={!richTextFormattingChanges}
              />
              <DiffCheckbox<boolean>
                label={t('PdfDiff.richText.textColor')}
                currentValue={richTextShowColorChanges}
                onValue={true}
                offValue={false}
                onClick={(value) => {
                  setRichTextShowColorChanges(value);
                }}
                className={css.richTextFormattingContent}
                disabled={!richTextFormattingChanges}
              />
            </div>
            <div className={css.sidebarNestedGreySection}>
              <DiffToggle<boolean>
                label={t('PdfDiff.richText.showMovedText')}
                currentValue={richTextShowMoves}
                onValue={true}
                offValue={false}
                onClick={(state) => {
                  changeRichTextShowMoves(state);
                }}
                icon={arrowRightCircleSVG}
                iconClassName={css.showMovesIcon}
              />
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default ConfigureDropdown;
