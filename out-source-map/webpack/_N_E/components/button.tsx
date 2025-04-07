import cx from 'classnames';
import Router from 'next/router';
import React from 'react';

import css from './button.module.css';

interface ButtonProps {
  type?:
    | 'brand'
    | 'default'
    | 'light'
    | 'lighter'
    | 'white'
    | 'danger'
    | 'red'
    | 'link'
    | 'clean'
    | 'facebook'
    | 'twitter'
    | 'grey';
  size?: 'tiny' | 'small' | 'medium' | 'big';
  tooltip?: string;
  fullWidth?: boolean;
  autoWidth?: boolean;
  width?: string;
  disabled?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  buttonType?: 'submit' | 'reset' | 'button';
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  type = 'primary',
  size,
  href,
  tooltip,
  onClick = null,
  width,
  fullWidth,
  autoWidth,
  disabled,
  style,
  buttonType,
  children,
}) => {
  const classNames = cx([
    type != 'clean' && css.button,
    css[type],
    size && css[size],
    disabled && css.disabled,
    autoWidth && css.autoWidth,
    'button',
  ]);
  let Element: keyof JSX.IntrinsicElements = 'span';
  let extraProps = {};
  if (!disabled) {
    if (!onClick && !buttonType) {
      if (href) {
        Element = 'a';
        extraProps = {
          onClick: (ev: Event) => {
            ev.preventDefault();
            Router.push(href);
          },
          href,
        };
      }
    } else {
      Element = 'button';
      extraProps = {
        onClick,
        type: buttonType || 'submit',
        name: children,
      };
    }
  }

  // inject width properties of button from parameter, but allow overriding
  style = {
    width: (width ? width + 'px' : fullWidth && '100%') || 'auto',
    ...style,
  };
  return (
    <Element
      {...extraProps}
      className={classNames}
      style={style}
      data-tooltip={tooltip}
    >
      {children}
    </Element>
  );
};
export default Button;
