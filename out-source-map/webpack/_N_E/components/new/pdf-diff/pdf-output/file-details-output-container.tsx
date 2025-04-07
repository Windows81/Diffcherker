import * as React from 'react';
import cx from 'classnames';
import sharedCss from './pdf-output-shared.module.css';
import css from './file-details.module.css';

interface FileDetailsOutputContainerProps {
  children: React.ReactNode;
}

const FileDetailsOutputContainer: React.FC<FileDetailsOutputContainerProps> = ({
  children,
}) => {
  return (
    <div className={sharedCss.container}>
      <div className={cx(sharedCss.output, sharedCss.white, css.fileDetails)}>
        {children}
      </div>
    </div>
  );
};

export default FileDetailsOutputContainer;
