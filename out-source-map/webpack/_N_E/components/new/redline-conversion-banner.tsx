import Icon from 'components/shared/icon';
import css from './redline-conversion-banner.module.css';
import IconButton from 'components/shared/icon-button';
import CancelSvg from 'components/shared/icons/cancel.svg';
import ErrorCircleSvg from 'components/shared/icons/opaque/error-circle.svg';
import { RedlineOversizedPages } from './pdf-diff/pdf-diff-checker';

const getOversizedPagesMessage = (
  pages: RedlineOversizedPages,
  leftFilename: string,
  rightFilename: string,
) => {
  const hasLeftPages = pages.left.length > 0;
  const hasRightPages = pages.right.length > 0;

  const getLine = (filename: string, pages: number[]) => {
    let pageString = '';

    if (pages.length === 1) {
      pageString = `Page ${pages[0] + 1}`;
    } else if (1 < pages.length && pages.length < 6) {
      const joinedPages = pages.map((page) => page + 1).join(', ');
      pageString = `Pages ${joinedPages}`;
    } else if (pages.length >= 6) {
      pageString = `${pages.length} pages`;
    }

    return (
      <div className={css.lineContainer}>
        <span className={css.filenameText}>{filename}:</span>
        <span className={css.pageStringText}>&nbsp;{pageString}</span>
      </div>
    );
  };

  return (
    <>
      {hasLeftPages && getLine(leftFilename, pages.left)}
      {hasRightPages && getLine(rightFilename, pages.right)}
    </>
  );
};

export default function RedlineConversionBanner({
  pages,
  leftFilename,
  rightFilename,
  setShowRedlineConversionBanner,
}: {
  pages: {
    left: number[];
    right: number[];
  };
  leftFilename: string;
  rightFilename: string;
  setShowRedlineConversionBanner: (value: boolean) => void;
}) {
  return (
    <div className={css.container}>
      <div className={css.top}>
        <Icon svg={ErrorCircleSvg} />
        <div className={css.bold}>
          Resized some pages while comparing documents.
        </div>
      </div>
      <p className={css.message}>
        {getOversizedPagesMessage(pages, leftFilename, rightFilename)}
      </p>
      <IconButton
        style="text"
        tone="base"
        svg={CancelSvg}
        onClick={() => setShowRedlineConversionBanner(false)}
        className={css.closeButton}
        aria-label="Close banner"
      />
    </div>
  );
}
