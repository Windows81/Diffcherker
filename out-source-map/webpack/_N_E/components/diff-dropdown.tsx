import Dropdown from 'components/shared/dropdown';
import {
  DiffTypeDropdownOutputType,
  ExcelDiffOutputTypes,
  PdfDiffOutputTypes,
} from 'lib/output-types';
import Icon from 'components/shared/icon';
import OkSvg from 'components/shared/icons/ok.svg';
import css from './diff-dropdown.module.css';
import cx from 'classnames';
import ChevronDownSvg from 'components/shared/icons/chevron-down.svg';
import ChevronUpSvg from 'components/shared/icons/chevron-up.svg';
import React from 'react';

type outputType = ExcelDiffOutputTypes | PdfDiffOutputTypes;

interface DiffDropdownOptionProps<T extends outputType> {
  index: number;
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  isSelected: boolean;
  setOutputType: (val: T) => void;
}

const DiffDropdownOption = <T extends outputType>({
  index,
  svg,
  title,
  body,
  isSelected,
  setOutputType,
}: DiffDropdownOptionProps<T>) => {
  const Svg = svg;
  return (
    <div
      className={cx(css.dropdownOption, isSelected && css.selected)}
      onClick={() => setOutputType(title as T)}
      onKeyDown={(e) => {
        if (e.code === 'Enter') {
          setOutputType(title as T);
        }
      }}
      tabIndex={index}
      role="button"
    >
      <div className={cx(css.icon)}>
        {isSelected && <Icon svg={OkSvg} size="default" />}
      </div>
      <div className={cx(css.image, isSelected && css.selected)}>
        <Svg className={css.svg} />
      </div>
      <div className={cx(css.text, isSelected && css.selected)}>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </div>
  );
};

interface DiffDropdownProps<T extends outputType> {
  outputType: T;
  setOutputType: (val: T) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  dropdownOutputTypes: DiffTypeDropdownOutputType<T>[];
  disabled?: boolean;
}

export const DiffDropdown = <T extends outputType>({
  outputType,
  setOutputType,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownOutputTypes,
  disabled,
}: DiffDropdownProps<T>) => {
  const maxHeight =
    typeof window !== 'undefined' ? window.innerHeight - 100 : 530;
  return (
    <Dropdown
      isOpen={isDropdownOpen}
      display={
        <div className={css.content}>
          <div className={css.text}>
            <span className={css.grey}>Type: </span>
            <span>{outputType}</span>
          </div>
          {isDropdownOpen ? <ChevronDownSvg /> : <ChevronUpSvg />}
        </div>
      }
      buttonClassName={css.button}
      buttonOpenClassName={css.open}
      setIsOpen={setIsDropdownOpen}
      direction="up"
      maxHeight={maxHeight}
      menuClassName={css.menu}
      disabled={disabled}
    >
      <div className={css.container}>
        {dropdownOutputTypes.map(
          (type, index) =>
            type.image &&
            type.description && (
              <div className={css.option} key={index}>
                <DiffDropdownOption
                  index={index}
                  svg={type.image}
                  title={type.label}
                  body={type.description}
                  isSelected={outputType == type.label}
                  setOutputType={setOutputType}
                />
              </div>
            ),
        )}
      </div>
    </Dropdown>
  );
};
