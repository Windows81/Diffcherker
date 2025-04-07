import {
  FC,
  ForwardedRef,
  MutableRefObject,
  createContext,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { VirtuosoHandle } from 'react-virtuoso';
import { Diff } from 'types/diff';

import { useHotkeys } from 'lib/hooks/use-hotkeys';
import { useWorker } from 'lib/hooks/use-worker';
import RenderableDiffItems from 'lib/renderable-diff-items';
import DiffFuseSearcher, {
  DiffSearchResult,
} from 'lib/search/diff-fuse-searcher';
import { DiffBlock } from 'types/normalize';
import { findNextMergeBlock } from './commands/find-next-merge-block';
import { findPrevMergeBlock } from './commands/find-prev-merge-block';
import merge, { MergeDirection } from './commands/merge';
import {
  HighlightChunks,
  processHighlightChunks,
} from './commands/process-highlight-chunk';
import { replaceSide } from './commands/replace-side';
import { scrollToBlock, scrollToLine, scrollToRow } from './commands/scroll-to';
import { sortLines } from './commands/sort-lines';
import { swapSides } from './commands/swap-sides';
import { toLower } from './commands/to-lower';
import { toSpaces } from './commands/to-spaces';
import { trim } from './commands/trim';
import useProcessDiffForSettings from './hooks/process-diff-for-settings';
import { rowInView } from './queries/row-in-view';

import { CommentLocation } from 'types/comment';
import { CommentThread } from 'types/comment-thread';
import { DiffSide } from 'types/diffSide';
import { type TextDiffOutputSettingsObject } from './settings';

import { Meta } from 'types/normalize';
import { commentLocationsEqual } from './queries/comment-locations-equal';
import { ExplainBlockItem } from './types/explain-block-item';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { useDesktopModal } from '../desktop-modal/context';
import {
  canUseFeature,
  DiffFeature,
  increaseFeatureUsage,
} from 'lib/diff-features';

export type TextDiffOutputApi = {
  collapseAllDiffBlocks: () => void;
  expandBlock: (block: DiffBlock) => void;
  selectBlock: (index: number) => void;
  scrollToRow: (index: number) => void;
  scrollToBlock: (index: number) => void;
  scrollToLine: (index: number, side: DiffSide) => void;
  endSelection: () => void;
  merge: (direction: MergeDirection) => void;
  sortLines: () => void;
  swapSides: () => void;
  toLowercase: () => void;
  toSpaces: () => void;
  trimWhitespace: () => void;
  replaceSide: (side: DiffSide, text: string) => void;
  showSearchResult: (searchResult: DiffSearchResult) => void;
  search: (searchText: string) => void;
  selectFirstMergeBlock: () => void;
  selectNextMergeBlock: () => void;
  selectPrevMergeBlock: () => void;
  endSearch: () => void;
  openComment: (commentLocation: CommentLocation) => void;
  closeComment: (commentLocation: CommentLocation) => void;
  openAllComments: (side?: DiffSide) => void;
  closeAllComments: (side?: DiffSide) => void;
  getExplainBlockItemFor: (block: DiffBlock) => ExplainBlockItem;
  setExplainBlockItemFor: (block: DiffBlock, item: ExplainBlockItem) => void;
  checkFeatureUsage: (feature: DiffFeature) => boolean;
};

interface TextDiffOutputContextInterface {
  diff: Diff;
  api: TextDiffOutputApi;
  expandedDiffBlocks: DiffBlock[];
  renderableDiffItems: RenderableDiffItems | never[];
  selectedBlock?: DiffBlock;
  selectedBlockIndex: number;
  isSearching?: boolean;
  searchText?: string;
  searchIndex?: number;
  searchResults?: DiffSearchResult[];
  highlightChunks?: HighlightChunks;
  openCommentLocations: CommentLocation[];
  selectedDiffBlockLeftText: string;
  selectedDiffBlockRightText: string;
}

export const nullApi: TextDiffOutputApi = {
  collapseAllDiffBlocks: () => {
    /* noop */
  },
  expandBlock: (_block: DiffBlock) => {
    /* noop */
  },
  selectBlock: (_index: number) => {
    /* noop */
  },
  scrollToRow: (_index: number) => {
    /* noop */
  },
  scrollToBlock: (_index: number) => {
    /* noop */
  },
  scrollToLine: (_index: number, _side: DiffSide) => {
    /* noop */
  },
  endSelection: () => {
    /* noop */
  },
  merge: (_direction: MergeDirection) => {
    /* noop */
  },
  sortLines: () => {
    /* noop */
  },
  swapSides: () => {
    /* noop */
  },
  toLowercase: () => {
    /* noop */
  },
  toSpaces: () => {
    /* noop */
  },
  trimWhitespace: () => {
    /* noop */
  },
  replaceSide: () => {
    /* noop */
  },
  showSearchResult: () => {
    /* noop */
  },
  search: () => {
    /* noop */
  },
  selectFirstMergeBlock: () => {
    /* noop */
  },
  selectNextMergeBlock: () => {
    /* noop */
  },
  selectPrevMergeBlock: () => {
    /* noop */
  },
  endSearch: () => {
    /* noop */
  },
  openComment: () => {
    /* noop */
  },
  closeComment: () => {
    /* noop */
  },
  openAllComments: () => {
    /* noop */
  },
  closeAllComments: () => {
    /* noop */
  },
  getExplainBlockItemFor: (_block: DiffBlock) => {
    return nullExplainItem;
  },
  setExplainBlockItemFor: (_block: DiffBlock, _item: ExplainBlockItem) => {
    /* noop */
  },
  checkFeatureUsage: () => false,
};

export const nullExplainItem = Object.freeze({
  explination: '',
  feedback: undefined,
});

const TextDiffOutputContext = createContext<TextDiffOutputContextInterface>({
  api: nullApi,
  diff: {},
  expandedDiffBlocks: [],
  renderableDiffItems: [],
  isSearching: false,
  searchText: '',
  searchIndex: -1,
  searchResults: [],
  highlightChunks: {},
  selectedBlockIndex: -1,
  openCommentLocations: [],
  selectedDiffBlockLeftText: '',
  selectedDiffBlockRightText: '',
});

type TextDiffOutputProviderProps = {
  diff: Diff;
  apiRef?: ForwardedRef<TextDiffOutputApi>;
  commentThreads?: CommentThread[];
  virtuoso: MutableRefObject<VirtuosoHandle | null>;
  scrollToOffset?: number;
  settings: TextDiffOutputSettingsObject;
  parentId: string;
  noSearching?: boolean;

  forceItemsAsBlocks?: boolean;
  onChange: (newDiff: Diff) => void;
  onBlockSelect?: (index: number) => void;
  onCommentOpen?: (location: CommentLocation) => void;
  onCommentClose?: (location: CommentLocation) => void;

  willOpenComment?: (location: CommentLocation) => boolean;
  willOpenAllComments?: (side?: DiffSide) => boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TextDiffOutputProvider: FC<
  React.PropsWithChildren<TextDiffOutputProviderProps>
> = ({
  diff,
  apiRef,
  commentThreads,
  virtuoso,
  settings,
  scrollToOffset = 0,
  parentId,
  noSearching,

  forceItemsAsBlocks,
  children,
  onChange,
  onBlockSelect,
  onCommentOpen,
  onCommentClose,

  willOpenComment,
  willOpenAllComments,
}) => {
  const api = useRef<TextDiffOutputApi>(nullApi);

  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(-1);
  const [expandedDiffBlocks, setExpandedDiffBlocks] = useState<DiffBlock[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [searchIndex, setSearchIndex] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<DiffSearchResult[]>([]);
  const [highlightChunks, setHighlightChunks] = useState<HighlightChunks>();
  const [currentApi, setCurrentApi] = useState<TextDiffOutputApi>(nullApi);
  const [openCommentLocations, setOpenCommentLocations] = useState<
    CommentLocation[]
  >([]);

  const [normalizeWorker] = useWorker('normalize', { restartable: true });

  const isPro = useAppSelector(isProUser);
  const { openDesktopModal } = useDesktopModal();

  /**
   * Hold on to the original diff (so editing and merging can take place on the original)
   * We  then processs the diff for a given settings object (unified vs split / diff level)
   * and use that one going forward.
   */
  const originalDiff = useMemo<Diff>(() => diff, [diff]);
  const currentDiff = useProcessDiffForSettings(diff, settings, onChange);

  // Ensure we're always working with a collection, good to memoize the empty collection to prevent re-renders
  const blocks = useMemo(() => currentDiff.blocks ?? [], [currentDiff.blocks]);
  const rows = useMemo(() => currentDiff.rows ?? [], [currentDiff.rows]);

  commentThreads = useMemo(() => commentThreads ?? [], [commentThreads]);

  // Compute the selected block from the index cursor
  const selectedBlock = useMemo<DiffBlock | undefined>(
    () => (blocks ?? [])[selectedBlockIndex],
    [blocks, selectedBlockIndex],
  );

  // Selected Block Rows
  const selectedBlockRows = useMemo<Meta[]>(
    () =>
      selectedBlock
        ? rows.slice(selectedBlock.lineStart, selectedBlock.lineEnd + 1)
        : [],
    [rows, selectedBlock],
  );

  // Left Text for selected block
  const selectedDiffBlockLeftText = useMemo<string>(
    () =>
      selectedBlockRows
        .map((line) => line.left?.chunks.map((chunk) => chunk.value).join(''))
        .join('\n'),
    [selectedBlockRows],
  );

  // Right Text for selected block
  const selectedDiffBlockRightText = useMemo<string>(
    () =>
      selectedBlockRows
        .map((line) => line.right?.chunks.map((chunk) => chunk.value).join(''))
        .join('\n'),
    [selectedBlockRows],
  );

  // Cache for explain blocks, to map explinations to blocks
  const explainBlockCache = useMemo<WeakMap<DiffBlock, ExplainBlockItem>>(
    () => new WeakMap<DiffBlock, ExplainBlockItem>(),
    [],
  );

  /**
   * This is a solution to allow virtuoso to render out individual rows when they are
   * 'equal' type, but render 'changed' type blocks to display as a single component containing rows.
   * This is a temporary measure until a better nested windowing solution comes about.
   * Future Consideration: Another idea is to render both blocks and rows but toggle between block and row on selection.
   */
  const renderableDiffItems = useMemo<RenderableDiffItems>(() => {
    return new RenderableDiffItems({
      diffBlocks: blocks,
      rows: rows,
      collapsible: settings.diffCompression === 'collapsed',
      expandedBlocks: expandedDiffBlocks,
      forceAllDiffBlocks: forceItemsAsBlocks,
    });
  }, [
    blocks,
    rows,
    settings.diffCompression,
    expandedDiffBlocks,
    forceItemsAsBlocks,
  ]);

  /**
   * Takes a newly edited diff and runs the diffing engine on it, then
   * emits the new diff in an `onChange` event
   */
  const createAndEmitNewDiff = useCallback(
    async (transformedDiff: Diff) => {
      const { data: newDiffData } = await normalizeWorker({
        left: transformedDiff.left ?? '',
        right: transformedDiff.right ?? '',
        diffLevel: settings.diffLevel,
      });

      if (newDiffData) {
        onChange({
          ...diff,
          ...newDiffData,
        });
      }
    },
    [diff, normalizeWorker, onChange, settings.diffLevel],
  );

  /**
   * Selects and scrolls to a given block reused a number of times in the api
   */
  const selectAndScrollToBlock = useCallback(
    (diffBlock: DiffBlock) => {
      const blockIndex = blocks.indexOf(diffBlock);
      setSelectedBlockIndex(blockIndex);
      onBlockSelect && onBlockSelect(blockIndex);
      scrollToBlock(blockIndex, virtuoso, renderableDiffItems, scrollToOffset);
    },
    [blocks, onBlockSelect, renderableDiffItems, scrollToOffset, virtuoso],
  );

  /**
   * Builds a map for fuse to be able to know exactly where to go to wrt results.
   */
  useEffect(() => {
    DiffFuseSearcher.buildSearchMap(rows, settings.diffType);
  }, [rows, settings.diffType]);

  /**
   * When the slug changes, remove all open comment locations
   */
  useEffect(() => {
    setOpenCommentLocations([]);
  }, [diff.slug]);

  /**
   * Bind cmd/ctrl+f to override the default search behaviour
   */
  useHotkeys('cmd+f', (e) => {
    if (noSearching) {
      return;
    }

    setIsSearching(true);
    e.preventDefault();
  });

  /**
   * Checks if the user can use the feature.
   *
   * Pro status is checked in the store
   * We need to check if they are pro before checking free usage via local storage,
   * since pro users can use features without any limitations.
   */
  const checkFeatureUsage = useCallback(
    (feature: DiffFeature) => {
      if (isPro) {
        return true;
      }

      increaseFeatureUsage(feature);

      if (!canUseFeature(feature)) {
        openDesktopModal(feature);
        return false;
      }
      return true;
    },
    [isPro, openDesktopModal],
  );

  /**
   * Meant to keep the internal ref's api up to date with the state variables
   * inside the componennt.
   */
  useEffect(() => {
    api.current = {
      collapseAllDiffBlocks: () => {
        setExpandedDiffBlocks([]);
      },
      expandBlock: (block: DiffBlock) => {
        setExpandedDiffBlocks((curr) => [...curr, block]);
      },
      selectBlock: (index: number) => {
        setSelectedBlockIndex(index);
        onBlockSelect && onBlockSelect(index);
      },
      scrollToRow: (index: number) => {
        scrollToRow(
          index,
          virtuoso,
          renderableDiffItems,
          parentId,
          scrollToOffset,
        );
      },
      scrollToBlock: (index: number) => {
        scrollToBlock(index, virtuoso, renderableDiffItems, scrollToOffset);
      },
      scrollToLine: (index: number, side: DiffSide) => {
        scrollToLine(
          index,
          side,
          virtuoso,
          renderableDiffItems,
          parentId,
          scrollToOffset,
        );
      },
      endSelection: () => {
        setSelectedBlockIndex(-1);
      },
      sortLines: () => {
        createAndEmitNewDiff(sortLines(currentDiff));
      },
      swapSides: () => {
        createAndEmitNewDiff(swapSides(currentDiff));
      },
      toLowercase: () => {
        createAndEmitNewDiff(toLower(currentDiff));
      },
      toSpaces: () => {
        createAndEmitNewDiff(toSpaces(currentDiff));
      },
      trimWhitespace: () => {
        createAndEmitNewDiff(trim(currentDiff));
      },
      replaceSide: (side: DiffSide, text: string) => {
        createAndEmitNewDiff(replaceSide(currentDiff, side, text));
      },
      merge: async (direction: MergeDirection) => {
        if (selectedBlock && currentDiff.blocks && originalDiff.blocks) {
          const blockIndex = currentDiff.blocks.indexOf(selectedBlock);
          const originalBlockToMerge = originalDiff.blocks[blockIndex];

          if (checkFeatureUsage(DiffFeature.MERGE) === false) {
            return;
          }

          createAndEmitNewDiff(
            merge(originalDiff, originalBlockToMerge, direction),
          );
        }
      },
      showSearchResult: (result: DiffSearchResult) => {
        if (searchResults) {
          setSearchIndex(searchResults.indexOf(result));
        }

        if (!rowInView(result.id, scrollToOffset)) {
          scrollToRow(
            result.rowIndex,
            virtuoso,
            renderableDiffItems,
            parentId,
            scrollToOffset,
          );
        }
      },
      search: (searchText: string) => {
        setSearchText(searchText);
        const results = DiffFuseSearcher.search(searchText);
        setSearchResults(results);
        setHighlightChunks(processHighlightChunks(results));

        // No results: -1
        // Has results, but used to be - 1, start it at 0
        // Has results, but isn't as large as it used to be, clamp it to the results length
        const newSearchIndex =
          results.length === 0
            ? -1
            : Math.min(Math.max(0, searchIndex), results.length - 1);
        setSearchIndex(newSearchIndex);
        const result = results[newSearchIndex];

        if (result && !rowInView(result.id, scrollToOffset)) {
          scrollToRow(
            result.rowIndex,
            virtuoso,
            renderableDiffItems,
            parentId,
            scrollToOffset,
          );
        }
      },
      selectFirstMergeBlock: () => {
        const diffBlock = findNextMergeBlock(currentDiff.blocks ?? []);

        if (diffBlock) {
          selectAndScrollToBlock(diffBlock);
        }
      },
      selectNextMergeBlock: () => {
        const diffBlock = findNextMergeBlock(blocks, selectedBlock);

        if (diffBlock) {
          selectAndScrollToBlock(diffBlock);
        }
      },
      selectPrevMergeBlock: () => {
        const diffBlock = findPrevMergeBlock(blocks, selectedBlock);

        if (diffBlock) {
          selectAndScrollToBlock(diffBlock);
        }
      },
      endSearch: () => {
        setIsSearching(false);
        setSearchIndex(-1);
        setSearchResults([]);
      },
      openComment: (commentLocation: CommentLocation) => {
        if (willOpenComment && willOpenComment(commentLocation) === false) {
          return;
        }

        // Remove open comment locations that don't have a persisted thread
        const persistedCommentLocations = openCommentLocations.filter(
          (openCommentLocation) =>
            !!commentThreads.find((commentThread) =>
              commentLocationsEqual(openCommentLocation, commentThread),
            ),
        );

        setOpenCommentLocations([
          ...persistedCommentLocations,
          commentLocation,
        ]);

        onCommentOpen && onCommentOpen(commentLocation);
      },
      closeComment: (commentLocation: CommentLocation) => {
        setOpenCommentLocations(
          openCommentLocations.filter(
            (openCommentLocation) =>
              !commentLocationsEqual(openCommentLocation, commentLocation),
          ),
        );

        onCommentClose && onCommentClose(commentLocation);
      },
      openAllComments: (side?: DiffSide) => {
        if (willOpenAllComments && willOpenAllComments(side) === false) {
          return;
        }

        if (!side) {
          setOpenCommentLocations(
            commentThreads.map((commentThread) => ({
              side: commentThread.side,
              lineNumber: commentThread.lineNumber,
            })),
          );
        } else {
          setOpenCommentLocations([
            ...openCommentLocations,
            ...commentThreads
              .filter(
                (commentThread) =>
                  commentThread.side === side &&
                  !openCommentLocations.find((openCommentLocations) =>
                    commentLocationsEqual(openCommentLocations, commentThread),
                  ),
              )
              .map((commentThread) => ({
                side: commentThread.side,
                lineNumber: commentThread.lineNumber,
              })),
          ]);
        }
      },
      closeAllComments: (side?: DiffSide) => {
        if (!side) {
          setOpenCommentLocations([]);
        } else {
          setOpenCommentLocations(
            openCommentLocations.filter(
              (openCommentLocation) => openCommentLocation.side !== side,
            ),
          );
        }
      },
      getExplainBlockItemFor: (block: DiffBlock) => {
        return explainBlockCache.get(block) || nullExplainItem;
      },
      setExplainBlockItemFor: (block: DiffBlock, item: ExplainBlockItem) => {
        if (item === nullExplainItem) {
          explainBlockCache.delete(block);
          return;
        }
        explainBlockCache.set(block, item);
      },
      checkFeatureUsage,
    };

    setCurrentApi(api.current);
  }, [
    virtuoso,
    scrollToOffset,
    commentThreads,
    parentId,
    blocks,
    originalDiff,
    renderableDiffItems,
    selectedBlock,
    currentDiff,
    searchIndex,
    searchResults,
    openCommentLocations,
    explainBlockCache,
    onBlockSelect,
    createAndEmitNewDiff,
    onChange,
    selectAndScrollToBlock,
    onCommentOpen,
    onCommentClose,
    willOpenComment,
    willOpenAllComments,
    checkFeatureUsage,
    canUseFeature,
  ]);

  useImperativeHandle(apiRef, () => currentApi, [currentApi]);

  return (
    <TextDiffOutputContext.Provider
      value={{
        api: currentApi,
        diff: currentDiff,
        renderableDiffItems,
        expandedDiffBlocks,
        selectedBlock,
        isSearching,
        searchText,
        searchIndex,
        searchResults,
        highlightChunks,
        selectedBlockIndex,
        openCommentLocations,
        selectedDiffBlockLeftText,
        selectedDiffBlockRightText,
      }}
    >
      {children}
    </TextDiffOutputContext.Provider>
  );
};

export default TextDiffOutputContext;
