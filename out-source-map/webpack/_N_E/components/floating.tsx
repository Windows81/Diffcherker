import * as React from 'react';
import css from './floating.module.css';

interface FloatingProps {
  children: React.ReactNode;
  maxWidth?: string;
}

const Floating = ({
  children,
  maxWidth = '380px',
}: FloatingProps): JSX.Element => {
  return (
    <div className={css.floating} style={{ maxWidth }}>
      {children}
    </div>
  );
};
export default Floating;
