import { WorkBook } from 'xlsx';
import css from './excel-settings-bar.module.css';
import TextInput from 'components/shared/form/text-input';
import { ExcelSheetDropdown } from './excel-sheet-dropdown';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const InfoSVG = dynamic(
  () => import('components/shared/icons/info-circle.svg'),
  {
    ssr: false,
  },
);

interface ExcelSettingsBarProps {
  handleSheetSelect: (sheetName: string) => void;
  workBook?: WorkBook;
  selectedSheet: string;
  headerLineState: {
    value: string;
    setValue: (lineNumber: string) => void;
  };
  dropdownDirection: 'up' | 'down';
}

export default function ExcelSettingsBar({
  handleSheetSelect,
  workBook,
  selectedSheet,
  headerLineState,
  dropdownDirection,
}: ExcelSettingsBarProps) {
  const { value: headerLineNumber, setValue: setHeaderLineNumber } =
    headerLineState;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={css.settingBody}>
      <div className={css.selectWrapper}>
        <ExcelSheetDropdown
          outputType={selectedSheet}
          setOutputType={handleSheetSelect}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          dropdownOutputTypes={workBook?.SheetNames ?? []}
          direction={dropdownDirection}
        />
      </div>
      <div className={css.headerLineInput}>
        <div className={css.headerLineGroup}>
          <div className={css.headerLineText}>Header line:</div>
          <div className={css.lineInputWrapper}>
            <TextInput
              className={css.lineInput}
              value={headerLineNumber}
              inputMode="numeric"
              onChange={(ev) => {
                !RegExp(/[^0-9]+/).test(ev.target.value) &&
                  setHeaderLineNumber(ev.target.value);
              }}
            />
          </div>
        </div>
        <div className={css.tooltipContainer}>
          <span data-tooltip="The line number of the header row for this sheet.">
            <InfoSVG />
          </span>
        </div>
      </div>
    </div>
  );
}
