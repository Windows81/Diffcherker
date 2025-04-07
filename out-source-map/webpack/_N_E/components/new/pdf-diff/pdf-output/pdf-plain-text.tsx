import * as React from 'react';
import Button from 'components/shared/button';
import Badge from 'components/shared/badge';
import cx from 'classnames';
import { Diff } from 'types/diff';
import MessageBanner from 'components/shared/message-banner';
import dynamic from 'next/dynamic';
import { LoadingTextResults } from '../pdf-diff-checker';
import { DocxContentTypeView } from '../pdf-diff-checker';
import { Footnote } from 'types/docx-document';
import { FooterDiff } from '../commands/compute-footer-diffs';
import { HeaderDiff } from '../commands/compute-header-diffs';
import TextDiffOutputSettings, {
  TextDiffOutputSettingsObject,
} from 'components/new/text-diff-output/settings';
import TextSvg from 'components/shared/icons/text.svg';
import Tab from 'components/shared/tab';
import DocHeaderSvg from 'components/shared/icons/doc-header.svg';
import DocEndnotesSvg from 'components/shared/icons/doc-endnotes.svg';
import DocFootnotesSvg from 'components/shared/icons/doc-footnotes.svg';
import DocFooterSvg from 'components/shared/icons/doc-footer.svg';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import { TextDiffOutputApi } from 'components/new/text-diff-output/context';
import sharedCss from './pdf-output-shared.module.css';
import css from './pdf-plain-text.module.css';

import PdfSidebar from './pdf-sidebar';

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

const PlainTextLoading: React.FC = () => {
  return (
    <LoadingTextResults
      title="Computing results..."
      contents="Diffchecker is computing text differences."
    />
  );
};

interface PlainTextOutputContainerProps {
  textDiffData?: Diff;
  docxHasMultipleContentTypes: false | Footnote[] | undefined;
  docxContentTypeView: DocxContentTypeView;
  footersDiffData: FooterDiff[];
  footnotesDiffData?: Diff;
  headersDiffData: HeaderDiff[];
  textDiffOutputSettings: TextDiffOutputSettingsObject;
  endnotesDiffData?: Diff;
  apiRef: React.MutableRefObject<TextDiffOutputApi>;
  setTextDiffData: (newDiff: Diff) => void;
  setDocxContentTypeView: (val: DocxContentTypeView) => void;
  setTextDiffOutputSettings: (val: TextDiffOutputSettingsObject) => void;
  getPageTypeName: (pageType?: string) => string;
  getPageTypeIcon: (pageType?: string) => JSX.Element;
}

const PlainTextOutputContainer: React.FC<PlainTextOutputContainerProps> = ({
  textDiffData,
  docxHasMultipleContentTypes,
  docxContentTypeView,
  footersDiffData,
  footnotesDiffData,
  headersDiffData,
  textDiffOutputSettings,
  endnotesDiffData,
  apiRef,
  setTextDiffData,
  setDocxContentTypeView,
  setTextDiffOutputSettings,
  getPageTypeName,
  getPageTypeIcon,
}) => {
  if (!textDiffData) {
    return <PlainTextLoading />;
  }

  return (
    <div className={sharedCss.container}>
      <PdfSidebar header={<Tab svg={PreferencesSvg} label="Tools" />}>
        <div className={css.sidebarContent}>
          <div
            className={cx(docxContentTypeView !== 'content' && css.disabled)}
          >
            <TextDiffOutputSettings
              diff={textDiffData}
              apiRef={apiRef}
              settings={textDiffOutputSettings}
              onSettingsChange={setTextDiffOutputSettings}
            />
          </div>
        </div>
      </PdfSidebar>
      <div className={sharedCss.content}>
        {(!textDiffData.left || !textDiffData.right) && (
          <MessageBanner
            type="warning"
            title="Empty PDF detected"
            message={`It is most likely because it is a scanned version of a document, text is outlined or exported as images.\nTo see differences, toggle to the Image tab or OCR Text tab.`}
          />
        )}
        {textDiffData.left === textDiffData.right && (
          <MessageBanner
            type="info"
            title="The two files' text is identical"
            message="There is no text difference to show between these two files"
          />
        )}
        {docxHasMultipleContentTypes && (
          <div className={css.docxContentTypeNav}>
            <Button
              style={
                docxContentTypeView === 'content' ? 'secondary-alt' : 'text'
              }
              tone="green"
              iconStartSvg={TextSvg}
              onClick={() => setDocxContentTypeView('content')}
            >
              Content
            </Button>
            <Button
              style={
                docxContentTypeView === 'header' ? 'secondary-alt' : 'text'
              }
              tone="green"
              iconStartSvg={DocHeaderSvg}
              onClick={() => setDocxContentTypeView('header')}
              disabled={!headersDiffData.length}
            >
              <span className={css.withBadge}>
                Headers{' '}
                {headersDiffData.length > 1 && (
                  <Badge style={'primary'} tone={'green'}>
                    {headersDiffData.length}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              style={
                docxContentTypeView === 'footer' ? 'secondary-alt' : 'text'
              }
              tone="green"
              iconStartSvg={DocFooterSvg}
              onClick={() => setDocxContentTypeView('footer')}
              disabled={!footersDiffData.length}
            >
              <span className={css.withBadge}>
                Footers{' '}
                {footersDiffData.length > 1 && (
                  <Badge style={'primary'} tone={'green'}>
                    {footersDiffData.length}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              style={
                docxContentTypeView === 'footnotes' ? 'secondary-alt' : 'text'
              }
              tone="green"
              iconStartSvg={DocFootnotesSvg}
              onClick={() => setDocxContentTypeView('footnotes')}
              disabled={!footnotesDiffData}
            >
              Footnotes
            </Button>
            <Button
              style={
                docxContentTypeView === 'endnotes' ? 'secondary-alt' : 'text'
              }
              tone="green"
              iconStartSvg={DocEndnotesSvg}
              onClick={() => setDocxContentTypeView('endnotes')}
              disabled={!endnotesDiffData}
            >
              Endnotes
            </Button>
          </div>
        )}
        {docxContentTypeView === 'content' && (
          <div className={cx(sharedCss.output, sharedCss.white, css.textDiff)}>
            <TextDiffOutput
              apiRef={apiRef}
              diff={textDiffData}
              settings={textDiffOutputSettings}
              showTopBar={true}
              showLocationBar={true}
              onChange={setTextDiffData}
            />
          </div>
        )}
        {docxContentTypeView === 'header' &&
          headersDiffData?.map((diff, idx) => (
            <>
              {headersDiffData.length > 1 && (
                <div className={css.sectionHeader}>
                  {getPageTypeIcon(diff.docxPageType)}
                  <span className={css.sectionTag}>
                    <Badge style={'primary'} tone={'base'}>
                      Section {diff.docxPageSection}
                    </Badge>
                  </span>{' '}
                  <span className={css.pageType}>
                    {getPageTypeName(diff.docxPageType)}
                  </span>
                  <div className={css.circleBadge} />
                </div>
              )}
              <div className={cx(sharedCss.white, css.textDiff)} key={idx}>
                <TextDiffOutput
                  diff={diff}
                  settings={textDiffOutputSettings}
                  showTopBar={true}
                  noVirtuoso={true}
                  noSearching={true}
                />
              </div>
            </>
          ))}
        {docxContentTypeView === 'footer' &&
          footersDiffData?.map((diff, idx) => (
            <>
              {footersDiffData.length > 1 && (
                <div className={css.sectionHeader}>
                  {getPageTypeIcon(diff.docxPageType)}
                  <span className={css.sectionTag}>
                    <Badge style={'primary'} tone={'base'}>
                      Section {diff.docxPageSection}
                    </Badge>
                  </span>{' '}
                  <span className={css.pageType}>
                    {getPageTypeName(diff.docxPageType)}
                  </span>
                  <div className={css.circleBadge} />
                </div>
              )}
              <div className={cx(sharedCss.white, css.textDiff)} key={idx}>
                <TextDiffOutput
                  diff={diff}
                  settings={textDiffOutputSettings}
                  showTopBar={true}
                  noVirtuoso={true}
                  noSearching={true}
                />
              </div>
            </>
          ))}
        {docxContentTypeView === 'footnotes' && footnotesDiffData && (
          <div className={cx(sharedCss.white, css.textDiff)}>
            <TextDiffOutput
              diff={footnotesDiffData}
              settings={textDiffOutputSettings}
              showTopBar={true}
              noVirtuoso={true}
              noSearching={true}
            />
          </div>
        )}
        {docxContentTypeView === 'endnotes' && endnotesDiffData && (
          <div className={cx(sharedCss.white, css.textDiff)}>
            <TextDiffOutput
              diff={endnotesDiffData}
              settings={textDiffOutputSettings}
              showTopBar={true}
              noVirtuoso={true}
              noSearching={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlainTextOutputContainer;
