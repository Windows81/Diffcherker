import cx from 'classnames';
import { type Option } from 'types/option';

import Button from './button';
import css from './segmented-switch.module.css';

interface SegmentedSwitchProps<
  T extends string | number,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  U extends object = {},
> {
  selectedValue: T;
  options: Array<Option<T, U>>;
  onClick: (option: Option<T, U>) => void;
  disabled?: boolean;
  vertical?: boolean;
}

const SegmentedSwitch = <
  T extends string | number,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  U extends { svg?: React.FC<React.SVGProps<SVGSVGElement>> } = {},
>({
  selectedValue,
  options,
  onClick,
  disabled,
  vertical,
}: SegmentedSwitchProps<T, U>): React.ReactElement => {
  return (
    <div
      className={cx(css.container, {
        [css.disabled]: disabled,
        [css.vertical]: vertical,
      })}
    >
      {options.map((option) => {
        return (
          <Button
            key={option.value}
            style="basic"
            className={cx(css.option, {
              [css.selected]: selectedValue === option.value,
            })}
            onClick={() => onClick(option)}
            disabled={disabled}
            iconStartSvg={option.svg}
            badge={option.badge}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default SegmentedSwitch;
