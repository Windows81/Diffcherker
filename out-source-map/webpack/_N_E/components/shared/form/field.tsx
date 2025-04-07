import React from 'react';
import css from './field.module.css';

type FieldProps = {
  label?: string;
  type?: 'inline' | 'stacked';
  children: React.ReactNode;
};

export const Field: React.FC<FieldProps> = ({
  type = 'stacked',
  label,
  children,
}) => {
  return (
    <div className={css.field}>
      {label ? (
        <label className={css.label}>
          {label}
          {type === 'stacked' && <br />}
          {children}
        </label>
      ) : (
        children
      )}
    </div>
  );
};
