import * as React from 'react';
import cx from 'classnames';

import css from './alert.module.css';

export const types: Record<string, string> = {
  success: css.alertSuccess,
  info: css.alertInfo,
  warning: css.alertWarning,
  danger: css.alertDanger,
};

interface AlertProps {
  type: string;
  children: React.ReactNode;
}

const Alert = ({ type, children }: AlertProps): JSX.Element => {
  const alertType = types[type];
  return (
    <div>
      <div className={cx(css.alert, alertType)}>{children}</div>
    </div>
  );
};
export default Alert;
