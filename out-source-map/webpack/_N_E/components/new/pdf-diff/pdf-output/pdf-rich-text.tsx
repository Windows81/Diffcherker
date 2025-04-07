import cx from 'classnames';
import { useDesktopModal } from 'components/new/desktop-modal/context';
import {
  RichTextOutputApi,
  VERTICAL_ALIGN_OFFSET_PERCENTAGE,
} from 'components/new/pdf-diff/rich-text/rich-text-output';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import MessageBanner from 'components/shared/message-banner';
import Modal from 'components/shared/modal';
import SimpleVirtualizedList, {
  SimpleVirtualizedListApi,
} from 'components/shared/simple-virtualized-list';
import ipcEvents from 'ipc-events';
import {
  canUseFeature,
  DiffFeature,
  increaseFeatureUsage,
} from 'lib/diff-features';
import { PdfDocumentState } from 'lib/hooks/use-diff-document';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import React, {
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { DiffLevel } from 'types/normalize';
import { type Option } from 'types/option';
import {
  RichTextChangeItem,
  RichTextDiff,
  RichTextExportType,
} from 'types/rich-text';
import ConfigureDropdown from '../rich-text/configure-dropdown';
import RichTextOutput from '../rich-text/rich-text-output';
import Toolbar from '../rich-text/toolbar';
import sharedCss from './pdf-output-shared.module.css';
import RichTextChange from './pdf-rich-text-change';
import css from './pdf-rich-text.module.css';
import PdfRichTextSidebar from './pdf-rich-text-sidebar';
import { t } from 'lib/react-tiny-i18n';

const RichTextLoading: React.FC = () => {
  return (
    <div className={cx(sharedCss.output, sharedCss.grey, sharedCss.loader)}>
      <LoadingCircle style="secondary" />
      <span className={sharedCss.mainLoadingText}>Loading results...</span>
      <span>Diffchecker is computing differences for each page.</span>
      <span>In case of larger documents, it may take some time.</span>
    </div>
  );
};

interface RichTextOutputContainerProps {
  richTextDiffData?: RichTextDiff;
  leftDocumentContent?: PDFiumDocumentContent;
  rightDocumentContent?: PDFiumDocumentContent;
  leftState?: PdfDocumentState;
  rightState?: PdfDocumentState;
  richTextFormattingChanges: boolean;
  richTextShowFontFamilyChanges: boolean;
  richTextShowFontSizeChanges: boolean;
  richTextShowColorChanges: boolean;
  richTextShowMoves: boolean;
  richTextDiffLevel: DiffLevel;
  richTextExporting: boolean;
  richTextLoading: boolean;
  textDiffLevelOptions: Option<DiffLevel>[];
  changeRichTextDiffLevel: (level: DiffLevel) => void;
  changeRichTextShowMoves: (state: boolean) => void;
  setRichTextFormattingChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowColorChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowFontFamilyChanges: (value: SetStateAction<boolean>) => void;
  setRichTextShowFontSizeChanges: (value: SetStateAction<boolean>) => void;
  setRichTextExporting: (value: SetStateAction<boolean>) => void;
}

const RichTextOutputContainer: React.FC<RichTextOutputContainerProps> = ({
  richTextDiffData,
  leftDocumentContent,
  rightDocumentContent,
  leftState,
  rightState,
  richTextFormattingChanges,
  richTextShowFontFamilyChanges,
  richTextShowFontSizeChanges,
  richTextShowColorChanges,
  richTextShowMoves,
  richTextDiffLevel,
  richTextExporting,
  richTextLoading,
  textDiffLevelOptions,
  changeRichTextDiffLevel,
  changeRichTextShowMoves,
  setRichTextFormattingChanges,
  setRichTextShowColorChanges,
  setRichTextShowFontFamilyChanges,
  setRichTextShowFontSizeChanges,
  setRichTextExporting,
}) => {
  const [hoveredChunkId, setHoveredChunkId] = useState<number>(-1);
  const [selectedChunkId, setSelectedChunkId] = useState<number>(-1);

  const isPro = useAppSelector(isProUser);

  // Scrolling semaphores
  const [isScrollLocked, setIsScrollLocked] = useState<boolean>(true);

  const richTextOutputApi = useRef<RichTextOutputApi>(null);
  const simpleVirtualizedListApi = useRef<SimpleVirtualizedListApi>(null);

  const { openDesktopModal } = useDesktopModal();

  const showFontFamilyChanges =
    richTextShowFontFamilyChanges && richTextFormattingChanges;
  const showFontSizeChanges =
    richTextShowFontSizeChanges && richTextFormattingChanges;
  const showFontColorChanges =
    richTextShowColorChanges && richTextFormattingChanges;

  const filteredChangeLog = useMemo<RichTextChangeItem[]>(() => {
    return (
      richTextDiffData?.changeLog.filter((log) => {
        if (log.type === 'style' && !richTextFormattingChanges) {
          return false;
        } else if (log.type === 'style') {
          const fontFamilyChanged =
            showFontFamilyChanges && log.chunkBefore.fontFamilyChanged;
          const fontSizeChanged =
            showFontSizeChanges && log.chunkBefore.fontSizeChanged;
          const colorChanged =
            showFontColorChanges && log.chunkBefore.colorChanged;

          return fontFamilyChanged || fontSizeChanged || colorChanged;
        } else {
          return true;
        }
      }) ?? []
    );
  }, [
    richTextDiffData?.changeLog,
    richTextFormattingChanges,
    showFontColorChanges,
    showFontFamilyChanges,
    showFontSizeChanges,
  ]);

  const exportRichText = useCallback(
    async (exportType: RichTextExportType, includeStyleChanges: boolean) => {
      if (!leftState || !rightState || !richTextDiffData) {
        return;
      }

      if (!isPro) {
        increaseFeatureUsage(DiffFeature.EXPORT_RICH_TEXT_PDF);

        if (!canUseFeature(DiffFeature.EXPORT_RICH_TEXT_PDF)) {
          openDesktopModal(DiffFeature.EXPORT_RICH_TEXT_PDF);
          return;
        }
      }

      setRichTextExporting(true);
      const getRichTextExportData = (
        await import('lib/pdfium/rich-text/get-rich-text-export-data')
      ).default;
      const data = await getRichTextExportData(
        exportType,
        includeStyleChanges,
        leftState,
        rightState,
        richTextDiffData,
      );
      const fileName = `UntitledRichTextDiff.pdf`.replace(/\s/g, '');
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        await window.ipcRenderer.invoke(ipcEvents.APP__EXPORT_RICH_TEXT, {
          fileContent: new Uint8Array(data),
          fileName,
        });
      } else {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      // Extract out the above to reuse if we ever decide to also include download as an option.

      setRichTextExporting(false);
    },
    [
      leftState,
      richTextDiffData,
      rightState,
      setRichTextExporting,
      isPro,
      openDesktopModal,
    ],
  );

  const scrollToChunkInPage = useCallback((id: number) => {
    richTextOutputApi.current?.scrollToChunk(id);
  }, []);

  const scrollToChunkInChanges = useCallback(
    (chunkId: number) => {
      if (simpleVirtualizedListApi.current && richTextDiffData) {
        const foundChunk = filteredChangeLog.find(
          (change) => change.chunkId === chunkId,
        );

        if (foundChunk) {
          const index = filteredChangeLog.indexOf(foundChunk);
          if (index >= 0) {
            // Scroll to the item but at the VERTICAL_ALIGN_OFFSET_PERCENTAGE
            const scrollFrame = simpleVirtualizedListApi.current.scrollFrameRef;
            const scrollFrameHeight =
              scrollFrame?.current?.getBoundingClientRect().height ?? 0;
            const offsetTop =
              scrollFrameHeight * VERTICAL_ALIGN_OFFSET_PERCENTAGE;

            simpleVirtualizedListApi.current.scrollToItem(index, {
              offsetTop,
              behavior: 'smooth',
            });
          }
        }
      }
    },
    [filteredChangeLog, richTextDiffData],
  );

  const onPageChunkClick = useCallback(
    (chunkId: number, event?: React.MouseEvent) => {
      setSelectedChunkId(chunkId);

      // Scroll to the chunk
      if (chunkId >= 0) {
        scrollToChunkInChanges(chunkId);
        scrollToChunkInPage(chunkId);
      }
      event?.stopPropagation();
    },
    [scrollToChunkInChanges, scrollToChunkInPage],
  );

  const onChangeChunkClick = useCallback(
    (chunkId: number, event?: React.MouseEvent) => {
      setSelectedChunkId(chunkId);

      // Scroll to the chunk
      if (chunkId >= 0) {
        scrollToChunkInPage(chunkId);
        scrollToChunkInChanges(chunkId);
      }
      event?.stopPropagation();
    },
    [scrollToChunkInChanges, scrollToChunkInPage],
  );

  const onChunkHover = useCallback((chunkId: number) => {
    setHoveredChunkId(chunkId);
  }, []);

  if (
    richTextLoading ||
    !richTextDiffData ||
    !leftDocumentContent ||
    !rightDocumentContent
  ) {
    return <RichTextLoading />;
  }

  return (
    <div className={cx(sharedCss.container, sharedCss.output)}>
      <div className={cx(sharedCss.content)}>
        {leftState?.document?.hash === rightState?.document?.hash && (
          <MessageBanner
            type="info"
            title="The two files are identical"
            message="These are the same file"
          />
        )}
        <Toolbar exportRichText={exportRichText} />
        <div className={cx(sharedCss.grey, sharedCss.noFlex)}>
          <RichTextOutput
            ref={richTextOutputApi}
            leftChunks={richTextDiffData.left}
            leftImages={leftDocumentContent.images}
            rightChunks={richTextDiffData.right}
            rightImages={rightDocumentContent.images}
            showFontFamilyChanges={showFontFamilyChanges}
            showFontSizeChanges={showFontSizeChanges}
            showColorChanges={showFontColorChanges}
            selectedChunkId={selectedChunkId}
            onChunkClick={onPageChunkClick}
            hoveredChunkId={hoveredChunkId}
            onChunkHover={onChunkHover}
            isScrollLocked={isScrollLocked}
            setIsScrollLocked={setIsScrollLocked}
            setSelectedChunkId={setSelectedChunkId}
          />
        </div>
      </div>
      <PdfRichTextSidebar
        header={
          <ConfigureDropdown
            richTextFormattingChanges={richTextFormattingChanges}
            richTextShowMoves={richTextShowMoves}
            richTextShowFontFamilyChanges={richTextShowFontFamilyChanges}
            richTextShowFontSizeChanges={richTextShowFontSizeChanges}
            richTextShowColorChanges={richTextShowColorChanges}
            richTextDiffLevel={richTextDiffLevel}
            textDiffLevelOptions={textDiffLevelOptions}
            isScrollLocked={isScrollLocked}
            changeRichTextDiffLevel={changeRichTextDiffLevel}
            changeRichTextShowMoves={changeRichTextShowMoves}
            setRichTextFormattingChanges={setRichTextFormattingChanges}
            setRichTextShowColorChanges={setRichTextShowColorChanges}
            setRichTextShowFontFamilyChanges={setRichTextShowFontFamilyChanges}
            setRichTextShowFontSizeChanges={setRichTextShowFontSizeChanges}
            setIsScrollLocked={setIsScrollLocked}
          />
        }
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={css.changesWrapper}
          onClick={() => setSelectedChunkId(-1)}
        >
          <div className={css.changes}>
            {filteredChangeLog && filteredChangeLog.length > 0 ? (
              <>
                <div className={css.changesTitle}>
                  {t('PdfDiff.richText.changes')}
                </div>
                <SimpleVirtualizedList
                  className={cx('pdf-rich-text-changes-virtuoso', css.virtuoso)}
                  items={filteredChangeLog}
                  passiveEventHandlers={true}
                  defaultItemHeight={88}
                  itemOverScan={20}
                  layoutBatchSize={200}
                  ref={simpleVirtualizedListApi}
                >
                  {({ item: change, index: i, height }) => (
                    <div data-height={height}>
                      <RichTextChange
                        key={i}
                        className={css.changeLog}
                        change={change}
                        isHovered={hoveredChunkId === change.chunkId}
                        isSelected={selectedChunkId === change.chunkId}
                        showFontFamilyChanges={showFontFamilyChanges}
                        showFontSizeChanges={showFontSizeChanges}
                        showFontColorChanges={showFontColorChanges}
                        onChunkClick={onChangeChunkClick}
                        onChunkHover={onChunkHover}
                      />
                    </div>
                  )}
                </SimpleVirtualizedList>
              </>
            ) : (
              <div className={css.changesTitle}>No Changes</div>
            )}
          </div>
        </div>
      </PdfRichTextSidebar>
      <Modal noCloseButton isOpen={richTextExporting} minWidth="0">
        <div className={css.exportLoad}>
          <LoadingCircle size="small" />
          <div>
            <div>Preparing for Export...</div>
            <div className={css.exportDesc}>
              Large documents or complex diffs may take longer.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RichTextOutputContainer;
