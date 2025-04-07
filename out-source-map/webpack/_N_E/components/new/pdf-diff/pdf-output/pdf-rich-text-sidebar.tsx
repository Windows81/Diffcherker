import { useState } from 'react';
import cx from 'classnames';
import IconButton from 'components/shared/icon-button';
import ChevronLeftSvg from 'components/shared/icons/chevron-left.svg';
import ChevronRightSvg from 'components/shared/icons/chevron-right.svg';
import css from './pdf-rich-text-sidebar.module.css';

interface PdfRichTextSidebarProps {
  header: React.ReactNode;
}

const PdfRichTextSidebar: React.FC<
  React.PropsWithChildren<PdfRichTextSidebarProps>
> = ({ header, children }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className={cx(css.sidebar, isVisible ? css.open : css.closed)}>
      <IconButton
        style="text"
        tone="base"
        svg={isVisible ? ChevronRightSvg : ChevronLeftSvg}
        onClick={() => setIsVisible(!isVisible)}
        className={css.minimizeButton}
        aria-label="Minimize sidebar"
      />
      <div className={css.header}>{header}</div>
      <div className={css.content}>{children}</div>
    </div>
  );
};

export default PdfRichTextSidebar;
