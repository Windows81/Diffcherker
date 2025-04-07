import cx from 'classnames';
import React from 'react';

import css from './text-input.module.css';

type TextInputProps = {
  size?: 'default' | 'small' | 'xs';
  error?: boolean;
} & Omit<JSX.IntrinsicElements['input'], 'size'>;

const TextInput: React.ForwardRefRenderFunction<
  HTMLInputElement,
  TextInputProps
> = ({ size = 'default', error, ...props }, ref) => {
  return (
    <input
      {...props}
      className={cx(css.input, css[size], error && css.error, props.className)}
      ref={ref}
    />
  );
};

export default React.forwardRef(TextInput);
