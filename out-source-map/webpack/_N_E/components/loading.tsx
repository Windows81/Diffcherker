import * as React from 'react';

import css from './loading.module.css';

interface LoadingProps {
  message?: string;
  style?: React.CSSProperties;
  icon?: string;
}

const Loading: React.FC<LoadingProps> = (props) => {
  return (
    <div className={css.loading} style={props.style}>
      {props.icon && <img className={css.icon} src={props.icon} alt="icon" />}
      <div className="body">
        <svg className={css.spinner} viewBox="0 0 50 50">
          <circle
            className={css.path}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
          ></circle>
        </svg>
        <div className={css.message}>{props.message}</div>
      </div>
    </div>
  );
};

export default Loading;
