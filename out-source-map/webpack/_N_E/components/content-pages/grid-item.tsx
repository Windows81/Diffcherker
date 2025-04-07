import * as React from 'react';
import cx from 'classnames';
import css from './grid-item.module.css';

interface GridItemProps {
  size: number;
  children: React.ReactNode;
}

const GridItem = ({ size, children }: GridItemProps): JSX.Element => {
  return (
    <div className={cx(css.gridItem, css[`gridItemSize${size}`])}>
      {children}
    </div>
  );
};

export default GridItem;
