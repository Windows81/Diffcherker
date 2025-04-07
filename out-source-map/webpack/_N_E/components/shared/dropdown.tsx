import cx from 'classnames';
import { useEffect, useRef } from 'react';
import { type Option } from 'types/option';

import css from './dropdown.module.css';
import Icon from './icon';
import IconButton from './icon-button';
import ChevronDownSvg from './icons/chevron-down.svg';
import ChevronUpSvg from './icons/chevron-up.svg';
import Button from './button';

type BaseDropdownProps = {
  isOpen: boolean;
  setIsOpen: (newState: boolean) => void;

  rightAlign?: boolean;
  direction?: 'up' | 'down';
  dropdownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  buttonOpenClassName?: string;
  onOpen?: () => void;

  closeDropdownOnClick?: boolean;
  maxHeight?: number;
  disabled?: boolean;
};

interface StyledDropdownProps {
  display: string | React.FC<React.SVGProps<SVGSVGElement>>;
}

interface CustomDropdownProps {
  display: React.ReactNode;
}

interface DropdownWithOptionsProps<
  T extends string | number,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  U extends object = {},
> {
  options: Array<Option<T, U>>;
  onChange: (arg: Option<T, U>) => void;
}

type DropdownProps<
  T extends string | number,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  U extends object = {},
> = BaseDropdownProps &
  (StyledDropdownProps | CustomDropdownProps) &
  (DropdownWithOptionsProps<T, U> | React.PropsWithChildren<unknown>);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const Dropdown = <T extends string | number, U extends object = {}>({
  isOpen,
  setIsOpen,
  rightAlign,
  direction = 'down',
  menuClassName,
  dropdownClassName,
  buttonClassName,
  buttonOpenClassName,

  onOpen,
  closeDropdownOnClick = true,
  maxHeight,
  disabled,
  ...props
}: DropdownProps<T, U>): React.ReactElement => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: Event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const onDocumentHidden = () => {
        if (document.visibilityState === 'hidden') {
          setIsOpen(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      document.addEventListener('focusin', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
      document.addEventListener('visibilitychange', onDocumentHidden);

      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('focusin', handleClickOutside);
        document.removeEventListener('touchend', handleClickOutside);
        document.removeEventListener('visibilitychange', onDocumentHidden);
      };
    }
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  const handleMouseDown = (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.TouchEvent<HTMLButtonElement>,
  ) => {
    if (
      event.type === 'mousedown' && // guarantees mouse event
      (event as React.MouseEvent).button !== 0 // 0 is the left mouse button
    ) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    setIsOpen(!isOpen);
  };

  const setOption = (newOption: Option<T, U>) => {
    if ('onChange' in props) {
      props.onChange(newOption);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={cx(css.root, dropdownClassName, {
        [css.isOpen]: isOpen,
        [css.rightAlign]: rightAlign,
        [css.text]: typeof props.display === 'string',
        [css.icon]: typeof props.display === 'function',
        [css.up]: direction === 'up',
        [css.disabled]: disabled,
      })}
    >
      {typeof props.display === 'string' ? (
        <Button
          style="clean"
          className={cx(
            css.buttonControl,
            buttonClassName,
            isOpen && buttonOpenClassName,
          )}
          onClick={handleMouseDown}
          onTouchEnd={handleMouseDown}
          data-testid="dropdown-button-one"
        >
          <span className={css.buttonText}>{props.display}</span>
          <Icon
            svg={
              isOpen
                ? direction === 'up'
                  ? ChevronDownSvg
                  : ChevronUpSvg
                : direction === 'up'
                  ? ChevronUpSvg
                  : ChevronDownSvg
            }
            size="small"
          />
        </Button>
      ) : typeof props.display === 'function' ? (
        <IconButton
          style="basic"
          svg={props.display}
          className={cx(
            css.buttonControl,
            buttonClassName,
            isOpen && buttonOpenClassName,
          )}
          onClick={handleMouseDown}
          onTouchEnd={handleMouseDown}
          aria-label="Open dropdown"
          data-testid="dropdown-button-two"
        />
      ) : (
        <Button
          style="clean"
          className={cx(buttonClassName, isOpen && buttonOpenClassName)}
          onClick={handleMouseDown}
          onTouchEnd={handleMouseDown}
          data-testid="dropdown-button-three"
        >
          {props.display}
        </Button>
      )}
      {isOpen && (
        <div
          role="menu"
          tabIndex={-1}
          ref={menuRef}
          className={cx(css.menu, menuClassName)}
          style={
            { '--max-height': `${maxHeight ?? 265}px` } as React.CSSProperties
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.target !== menuRef.current) {
              setIsOpen(false);
            }
          }}
          onClick={(event) => {
            if (event.target !== menuRef.current && closeDropdownOnClick) {
              setIsOpen(false);
            }
          }}
        >
          {'options' in props ? (
            <div className={css.options}>
              <DropdownOptions options={props.options} setOption={setOption} />
            </div>
          ) : (
            props.children
          )}
        </div>
      )}
    </div>
  );
};

interface DropdownOptionsProps<
  T extends string | number,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  U extends object = {},
> {
  options: Array<Option<T, U>>;
  setOption: (newOption: Option<T, U>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const DropdownOptions = <T extends string | number, U extends object = {}>({
  options,
  setOption,
}: DropdownOptionsProps<T, U>): React.ReactElement => {
  return (
    <>
      {options.map(
        (option) =>
          !option.hide && (
            <Button
              key={option.value}
              style="clean"
              className={cx(css.option, option.className, {
                [css.red]: 'tone' in option && option.tone === 'red',
              })}
              onClick={() => setOption(option)}
              onTouchEnd={() => setOption(option)}
            >
              {option.label}
            </Button>
          ),
      )}
    </>
  );
};

export default Dropdown;
