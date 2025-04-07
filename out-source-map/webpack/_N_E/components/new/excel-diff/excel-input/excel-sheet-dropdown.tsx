import Dropdown from 'components/shared/dropdown';
import css from './excel-sheet-dropdown.module.css';
import cx from 'classnames';
import ChevronDownSvg from 'components/shared/icons/chevron-down.svg';
import ChevronUpSvg from 'components/shared/icons/chevron-up.svg';
import React, { useRef } from 'react';

interface ExcelSheetDropdownOptionProps {
  index: number;
  sheet: string;
  isSelected: boolean;
  setOutputType: (val: string) => void;
  selectedOptionRef: React.RefObject<HTMLDivElement>;
}

const ExcelSheetDropdownOption = ({
  index,
  sheet,
  isSelected,
  setOutputType,
  selectedOptionRef,
}: ExcelSheetDropdownOptionProps) => {
  return (
    <div
      ref={isSelected ? selectedOptionRef : null}
      className={cx(css.dropdownOption, isSelected && css.selected)}
      onClick={() => setOutputType(sheet)}
      onKeyDown={(e) => {
        if (e.code === 'Enter') {
          setOutputType(sheet);
        }
      }}
      tabIndex={index}
      role="button"
    >
      <div className={cx(css.text, isSelected && css.selected)}>
        <p>{sheet}</p>
      </div>
    </div>
  );
};

interface ExcelSheetDropdownProps {
  outputType: string;
  setOutputType: (val: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  dropdownOutputTypes: string[];
  direction: 'up' | 'down';
}

export const ExcelSheetDropdown = ({
  outputType,
  setOutputType,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownOutputTypes,
  direction,
}: ExcelSheetDropdownProps) => {
  const selectedOptionRef = useRef<HTMLDivElement>(null);
  const MAX_HEIGHT = 260;

  const handleOpen = () => {
    selectedOptionRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
    });
  };

  return (
    <Dropdown
      isOpen={isDropdownOpen}
      onOpen={handleOpen}
      display={
        <div className={css.content}>
          <div className={css.text}>
            <span className={css.grey}>Sheet: </span>
            <span className={css.sheetName}>{outputType}</span>
          </div>
          {direction === 'up' &&
            (isDropdownOpen ? <ChevronDownSvg /> : <ChevronUpSvg />)}
          {direction === 'down' &&
            (isDropdownOpen ? <ChevronUpSvg /> : <ChevronDownSvg />)}
        </div>
      }
      buttonClassName={css.button}
      setIsOpen={setIsDropdownOpen}
      direction={direction}
      maxHeight={MAX_HEIGHT}
      menuClassName={css.menu}
    >
      <div className={css.container}>
        {dropdownOutputTypes.map((sheet, index) => (
          <div className={css.option} key={index}>
            <ExcelSheetDropdownOption
              index={index}
              sheet={sheet}
              isSelected={outputType == sheet}
              setOutputType={setOutputType}
              selectedOptionRef={selectedOptionRef}
            />
          </div>
        ))}
      </div>
    </Dropdown>
  );
};
