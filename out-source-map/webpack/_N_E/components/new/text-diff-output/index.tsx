import cx from 'classnames';
import TextDiffOutputContext from 'components/new/text-diff-output/context';
import { RenderableDiffItem } from 'lib/renderable-diff-items';
import { FC, ForwardedRef, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { CommentLocation } from 'types/comment';
import { Diff } from 'types/diff';
import css from './index.module.css';
import { TextDiffOutputApi, TextDiffOutputProvider } from './context';
import DiffBlock from './diff-block';
import DiffSearch from './diff-search';
import LocationBar from './location-bar';
import TextDiffOutputSettings, {
  defaultTextDiffOutputSettings,
  type TextDiffOutputSettingsObject,
} from './settings';
import TextDiffOutputItem from './text-diff-output-item';
import dynamic from 'next/dynamic';
import { CommentThread } from 'types/comment-thread';
import TextDiffOutputDetails from './details';
import { DiffSide } from 'types/diffSide';
import { DiffInputType } from 'types/diff-input-type';
import { RowMoveType } from 'types/moves';
import { usePdfIsExporting } from 'lib/state/pdfExport';
import createMoveStates from './commands/create-move-states';

const DiffMonacoEditor = dynamic(
  async () => await import('components/new/diff-monaco-editor'),
  {
    ssr: false,
  },
);

const EXTRA_WINDOW_PIXELS = 4000;
const INITIAL_ITEM_COUNT = 1000;
const LOCATION_BAR_PADDING = 6;
const ROW_HEIGHT = 24;

export type TextDiffOutputCommonProps = {
  allowMerging?: boolean;
  allowCodeMoves?: boolean;
  allowComments?: boolean;
  diffInputType?: DiffInputType;
  commentThreads?: CommentThread[];

  onCommentOpen?: (location: CommentLocation) => void;
  onCommentClose?: (location: CommentLocation) => void;

  settings?: TextDiffOutputSettingsObject;
};

type TextDiffOutputProps = {
  diff: Diff;
  apiRef?: ForwardedRef<TextDiffOutputApi>;
  noVirtuoso?: boolean;
  noSearching?: boolean;
  showLocationBar?: boolean;
  showTopBar?: boolean;
  showSideBar?: boolean;
  showSwapSides?: boolean;
  scrollToOffset?: number;
  onChange?: (newDiff: Diff) => void;
  onSettingsChange?: (newSettings: TextDiffOutputSettingsObject) => void;
  willOpenComment?: (location: CommentLocation) => boolean;
  willOpenAllComments?: (side?: DiffSide) => boolean;
  onBlockSelect?: (index: number) => void;
} & TextDiffOutputCommonProps;

const TextDiffOutput: FC<React.PropsWithChildren<TextDiffOutputProps>> = ({
  diff: propsDiff,
  apiRef,
  commentThreads,
  noVirtuoso,
  showLocationBar,
  scrollToOffset = 0,
  showSideBar,
  showSwapSides,
  showTopBar,
  noSearching,
  diffInputType = DiffInputType.TEXT,
  onSettingsChange: propsOnSettingsChange,
  onChange: propsOnChange,
  onBlockSelect,
  onCommentOpen,
  onCommentClose,
  willOpenComment,
  willOpenAllComments,
  settings: propsSettings,
  ...commonProps
}) => {
  const [elementId, setElementId] = useState<string>('');

  useEffect(() => {
    setElementId(
      `text-diff-output-${Math.random().toString(36).substring(2, 9)}`,
    );
  }, []);

  const isExporting = usePdfIsExporting();

  const [internalDiff, setDiff] = useState<Diff>(propsDiff);
  const [internalSettings, setSettings] =
    useState<TextDiffOutputSettingsObject>(
      propsSettings ?? defaultTextDiffOutputSettings,
    );
  const [listLoading, setListLoading] = useState(true);
  const virtuoso = useRef<VirtuosoHandle | null>(null);

  /**
   * Presence of the `onChange/onSettingsChange` and `diff/settings` prop determines
   * if the component is controlled / uncontrolled repsectively.
   *
   * Excel text diff output should always be controlled
   *
   * TODO: Could be a good idea to do this with onBlockSelect
   */
  const isDiffControlled =
    (propsOnChange && propsDiff) || diffInputType === DiffInputType.EXCEL;
  const diff = isDiffControlled ? propsDiff : internalDiff;
  const onChange = isDiffControlled
    ? (propsOnChange ?? setDiff)
    : (newDiff: Diff) => {
        propsOnChange && propsOnChange(newDiff);
        setDiff(newDiff);
      };

  const isSettingsControlled =
    (propsOnSettingsChange && propsSettings) || (propsSettings && !showSideBar);
  const settings = isSettingsControlled ? propsSettings : internalSettings;
  const onSettingsChange = isSettingsControlled
    ? (propsOnSettingsChange ?? setSettings)
    : (newSettings: TextDiffOutputSettingsObject) => {
        propsOnSettingsChange && propsOnSettingsChange(newSettings);
        setSettings(newSettings);
      };

  //TODO: This probably needs to move into the context, ok here for now
  const rows = diff.rows ?? [];
  const lineNumberWidth = rows.length.toString().length * 8;

  const [leftMoveStates, rightMoveStates]: [RowMoveType[], RowMoveType[]] =
    useMemo(() => createMoveStates(diff.moves), [diff.moves]);

  return (
    <TextDiffOutputProvider
      diff={diff}
      apiRef={apiRef}
      commentThreads={commentThreads}
      virtuoso={virtuoso}
      settings={settings}
      scrollToOffset={scrollToOffset}
      noSearching={noSearching}
      parentId={elementId}
      onChange={onChange}
      onBlockSelect={onBlockSelect}
      onCommentOpen={onCommentOpen}
      onCommentClose={onCommentClose}
      willOpenComment={willOpenComment}
      willOpenAllComments={willOpenAllComments}
    >
      <div className={css.rootContainer} data-testid="text-diff-output">
        {showSideBar && (
          <div className={css.sideBar}>
            <TextDiffOutputSettings
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        )}
        <div className={css.textOutput}>
          {showTopBar && (
            <TextDiffOutputDetails
              diff={diff}
              commentThreads={commentThreads}
              settings={settings}
              showSwapSides={showSwapSides}
            />
          )}
          {settings.diffVersion === 'live' ? (
            <DiffMonacoEditor
              diff={diff}
              settings={settings}
              onChange={onChange}
            />
          ) : (
            <TextDiffOutputContext.Consumer>
              {({
                diff,
                api,
                renderableDiffItems,
                expandedDiffBlocks,
                isSearching,
                searchText,
                searchResults,
                searchIndex,
                highlightChunks,
                openCommentLocations,
              }) => (
                <div className={css.container}>
                  <div className={css.innerContainer}>
                    <div id={elementId} className={css.textDiffContent}>
                      {noVirtuoso || isExporting ? (
                        <>
                          {(diff.blocks ?? []).map((block, index) => (
                            <DiffBlock
                              parentId={elementId}
                              key={index}
                              index={index}
                              diff={diff}
                              block={block}
                              lineNumberWidth={lineNumberWidth}
                              onExpandDiffblock={api.expandBlock}
                              onCommentOpen={api.openComment}
                              onCommentClose={api.closeComment}
                              commentThreads={commentThreads}
                              openCommentLocations={openCommentLocations}
                              diffInputType={diffInputType}
                              isUnified={settings.diffType === 'unified'}
                              highlightChunks={highlightChunks}
                              syntaxHighlight={settings.syntaxHighlight}
                              isUserSearching={isSearching}
                              shouldCollapseLines={
                                settings.diffCompression === 'collapsed'
                              }
                              isExpanded={expandedDiffBlocks.includes(block)}
                              currSearchResultId={
                                !!searchResults
                                  ? searchResults[searchIndex ?? 0]?.id
                                  : ''
                              }
                              moveStates={{
                                left: leftMoveStates,
                                right: rightMoveStates,
                              }}
                              {...commonProps}
                            />
                          ))}
                        </>
                      ) : (
                        <div className={cx({ [css.loading]: listLoading })}>
                          <Virtuoso
                            ref={virtuoso}
                            defaultItemHeight={ROW_HEIGHT}
                            data={renderableDiffItems}
                            onMouseDown={() => undefined}
                            useWindowScroll
                            totalListHeightChanged={() => setListLoading(false)}
                            initialItemCount={Math.min(
                              renderableDiffItems.length,
                              INITIAL_ITEM_COUNT,
                            )}
                            overscan={{
                              main: EXTRA_WINDOW_PIXELS,
                              reverse: EXTRA_WINDOW_PIXELS,
                            }}
                            itemContent={(
                              index: number,
                              item: RenderableDiffItem,
                            ) => {
                              return (
                                <TextDiffOutputItem
                                  key={index}
                                  parentId={elementId}
                                  index={item.index}
                                  type={item.type}
                                  diff={diff}
                                  typeData={item.data}
                                  lineNumberWidth={lineNumberWidth}
                                  onExpandDiffblock={api.expandBlock}
                                  onCommentOpen={api.openComment}
                                  onCommentClose={api.closeComment}
                                  commentThreads={commentThreads}
                                  openCommentLocations={openCommentLocations}
                                  expandedDiffBlocks={expandedDiffBlocks}
                                  diffInputType={diffInputType}
                                  isUnified={settings.diffType === 'unified'}
                                  syntaxHighlight={settings.syntaxHighlight}
                                  highlightChunks={highlightChunks}
                                  isUserSearching={isSearching}
                                  shouldCollapseLines={
                                    settings.diffCompression === 'collapsed'
                                  }
                                  currSearchResultId={
                                    !!searchResults
                                      ? searchResults[searchIndex ?? 0]?.id
                                      : ''
                                  }
                                  moveStates={{
                                    left: leftMoveStates,
                                    right: rightMoveStates,
                                  }}
                                  {...commonProps}
                                />
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {showLocationBar && (
                      <div
                        className={css.locationBar}
                        style={{
                          top: scrollToOffset + LOCATION_BAR_PADDING,
                          maxHeight: `calc(100vh - ${scrollToOffset}px - ${LOCATION_BAR_PADDING * 2}px)`,
                        }}
                      >
                        <LocationBar
                          diffBlocks={diff.blocks ?? []}
                          rows={diff.rows ?? []}
                          allowMerging={commonProps.allowMerging}
                        />
                      </div>
                    )}
                  </div>
                  {isSearching && (
                    <DiffSearch
                      onSearchTextChange={api.search}
                      onGotoResult={api.showSearchResult}
                      onSearchClose={api.endSearch}
                      searchText={searchText}
                      searchResults={searchResults}
                      searchIndex={searchIndex}
                      debounce={
                        diff.rows
                          ? (Math.min(rows.length, 20000) / 20000) * 1000
                          : 0
                      }
                    />
                  )}
                </div>
              )}
            </TextDiffOutputContext.Consumer>
          )}
        </div>
      </div>
    </TextDiffOutputProvider>
  );
};

export default TextDiffOutput;
