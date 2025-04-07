import { FC } from 'react';
import css from './output.module.css';
import Markdown from 'react-markdown';
import cx from 'classnames';

type ExplainOutputType = {
  className?: string;
  isWaitingForExplain: boolean;
  explanation: string;
};

const ExplainOutput: FC<ExplainOutputType> = ({
  className,
  isWaitingForExplain,
  explanation,
}) => {
  return (
    <div className={cx(css.explainOutput, className)}>
      {isWaitingForExplain ? (
        <div className={css.loader} />
      ) : (
        <Markdown>{explanation}</Markdown>
      )}
    </div>
  );
};

export default ExplainOutput;
