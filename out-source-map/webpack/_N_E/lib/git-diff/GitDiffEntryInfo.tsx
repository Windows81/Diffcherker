import React from 'react';
import Icon from 'components/shared/icon';
import InfoCircleIcon from 'components/shared/icons/info-circle.svg';
import css from './GitDiffEntryInfo.module.css';

export const GitDiffEntryInfo: React.FC<{ message: string }> = ({
  message,
}) => (
  <div className={css.gitDiffEntryInfo}>
    <Icon svg={InfoCircleIcon} size="default" />
    <span>{message}</span>
  </div>
);
