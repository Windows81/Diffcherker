import * as React from 'react';
import cx from 'classnames';
import { Diff } from 'types/diff';
import MessageBanner from 'components/shared/message-banner';
import dynamic from 'next/dynamic';
import TextDiffOutputSettings, {
  TextDiffOutputSettingsObject,
} from 'components/new/text-diff-output/settings';
import Tab from 'components/shared/tab';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import { TextDiffOutputApi } from 'components/new/text-diff-output/context';
import sharedCss from './pdf-output-shared.module.css';
import css from './pdf-plain-text.module.css';
import PdfSidebar from './pdf-sidebar';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import { LoadingTextResults } from '../pdf-diff-checker';

const TextDiffOutput = dynamic(
  async () => await import('components/new/text-diff-output'),
  {
    ssr: false,
    loading: () => (
      <LoadingTextResults
        title="Loading results..."
        contents="Preparing to load the results for display."
      />
    ),
  },
);

interface OCRLoadingProps {
  ocrLoading: boolean;
  ocrProgress: number;
  leftDocumentContent?: PDFiumDocumentContent;
  rightDocumentContent?: PDFiumDocumentContent;
}

const OCRLoading: React.FC<OCRLoadingProps> = ({
  ocrLoading,
  ocrProgress,
  leftDocumentContent,
  rightDocumentContent,
}) => {
  return (
    <div className={cx(sharedCss.output, sharedCss.white, sharedCss.loader)}>
      <LoadingCircle
        style="secondary"
        progress={
          ocrLoading && leftDocumentContent && rightDocumentContent
            ? ocrProgress
            : undefined
        }
      />
      <span className={sharedCss.mainLoadingText}>
        {ocrLoading && leftDocumentContent && rightDocumentContent
          ? 'Loading results...'
          : 'Initializing OCR...'}
      </span>
      <span>OCR diffing can take some time to complete.</span>
      <span>
        You may experience some slowness navigating to other tabs during loading
      </span>
    </div>
  );
};

interface OCRTextOutputContainerProps {
  ocrDiffData?: Diff;
  textDiffOutputSettings: TextDiffOutputSettingsObject;
  apiRef: React.MutableRefObject<TextDiffOutputApi>;
  ocrLoading: boolean;
  ocrProgress: number;
  leftDocumentContent?: PDFiumDocumentContent;
  rightDocumentContent?: PDFiumDocumentContent;
  setTextDiffOutputSettings: (val: TextDiffOutputSettingsObject) => void;
  setOcrDiffData: (newDiff: Diff) => void;
}

const OCRTextOutputContainer: React.FC<OCRTextOutputContainerProps> = ({
  ocrDiffData,
  textDiffOutputSettings,
  apiRef,
  ocrLoading,
  ocrProgress,
  leftDocumentContent,
  rightDocumentContent,
  setTextDiffOutputSettings,
  setOcrDiffData,
}) => {
  if (!ocrDiffData) {
    return (
      <OCRLoading
        ocrLoading={ocrLoading}
        ocrProgress={ocrProgress}
        leftDocumentContent={leftDocumentContent}
        rightDocumentContent={rightDocumentContent}
      />
    );
  }
  return (
    <div className={sharedCss.container}>
      <PdfSidebar header={<Tab svg={PreferencesSvg} label="Tools" />}>
        <div className={css.sidebarContent}>
          <TextDiffOutputSettings
            diff={ocrDiffData}
            apiRef={apiRef}
            settings={textDiffOutputSettings}
            onSettingsChange={setTextDiffOutputSettings}
          />
        </div>
      </PdfSidebar>
      <div className={sharedCss.content}>
        {ocrDiffData.left === ocrDiffData.right && (
          <MessageBanner
            type="info"
            title="The two files' text is identical"
            message="There is no text difference to show between these two files via OCR"
          />
        )}
        <div className={cx(sharedCss.output, sharedCss.white, css.textDiff)}>
          <TextDiffOutput
            apiRef={apiRef}
            diff={ocrDiffData}
            showLocationBar={true}
            settings={textDiffOutputSettings}
            showTopBar={true}
            allowMerging={false}
            onChange={setOcrDiffData}
          />
        </div>
      </div>
    </div>
  );
};

export default OCRTextOutputContainer;
