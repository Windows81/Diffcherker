import classNames from 'classnames';
import * as React from 'react';
import css from './Button.module.css';

type ButtonProps = React.ComponentPropsWithoutRef<'button'>;

/**
 * Generic button component. Mostly useful to create unstyled or ghost
 * type buttons.
 *
 * TODO(@izaakschroeder): Combine this with the component found in
 * `web/components/button.tsx` and perhaps others.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    return (
      <button
        ref={ref}
        className={classNames(className, css.button)}
        {...rest}
      />
    );
  },
);
Button.displayName = 'Button';
