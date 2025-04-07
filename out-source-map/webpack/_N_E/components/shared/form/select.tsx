import cx from 'classnames';
import Icon from 'components/shared/icon';
import ChevronDownSvg from 'components/shared/icons/chevron-down.svg';
import React from 'react';

import css from './select.module.css';

type SelectProps = {
  size?: 'default' | 'small' | 'xs';
} & Omit<JSX.IntrinsicElements['select'], 'size'>;

const Select: React.ForwardRefRenderFunction<HTMLSelectElement, SelectProps> = (
  { size = 'default', ...props },
  ref,
) => {
  return (
    <div className={cx(css.wrapper, css[size])}>
      <div className={css.arrow}>
        <Icon size="small" svg={ChevronDownSvg} />
      </div>
      <select
        {...props}
        className={cx(css.select, props.className)}
        ref={ref}
      />
    </div>
  );
};

export default React.forwardRef(Select);
