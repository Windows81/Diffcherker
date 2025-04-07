import * as React from 'react';
import classNames from 'classnames';

import css from './Input.module.css';

interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  /**
   * React content added after the `<input>`, inside component borders.
   */
  after?: React.ReactNode;
  /**
   * React content added before the `<input>`, inside component borders.
   */
  before?: React.ReactNode;
}

/**
 * Input component.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const { before, after, className, style, ...rest } = props;
    return (
      <div className={classNames(css.inputWrapper, className)} style={style}>
        <input ref={ref} className={css.input} type="text" {...rest} />
        <div className={css.inputBorder} />
        {before && <div className={css.inputDecoratorBefore}>{before}</div>}
        {after && <div className={css.inputDecoratorAfter}>{after}</div>}
      </div>
    );
  },
);
Input.displayName = 'Input';
