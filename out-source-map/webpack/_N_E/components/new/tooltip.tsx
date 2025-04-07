import React, { ReactNode } from 'react';
import cx from 'classnames';
import css from './tooltip.module.css';

interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom';
  children: ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  className,
}) => {
  return (
    <div className={cx(css.tooltipWrapper, className)}>
      <div className={css.tooltipTrigger}>{children}</div>
      <div className={cx(css.tooltip, css[position])}>{content}</div>
    </div>
  );
};

export default Tooltip;
