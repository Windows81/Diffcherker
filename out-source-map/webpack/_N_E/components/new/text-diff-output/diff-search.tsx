import IconButton from 'components/shared/icon-button';
import ArrowDownSvg from 'components/shared/icons/arrow-down.svg';
import ArrowUpSvg from 'components/shared/icons/arrow-up.svg';
import CancelSvg from 'components/shared/icons/cancel.svg';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useHotkeys } from 'lib/hooks/use-hotkeys';
import TextInput from '../../shared/form/text-input';
import css from './diff-search.module.css';

// we specify input id b/c parent component needs it to select DOM element
export const SEARCH_INPUT_ID = 'search-input';

type DiffSearchProps<P> = {
  searchResults?: P[];
  searchIndex?: number;
  searchText?: string;
  debounce?: number;
  onSearchIndex?: (newIndex: number) => void;
  onSearching?: (value: boolean) => void;
  onSearchClose?: () => void;
  onGotoResult?: (searchResult: P) => void;
  onSearchTextChange?: (newSearchText: string) => void;
};

const DiffSearch = <P,>({
  searchResults = [],
  searchIndex = -1,
  searchText = '',
  debounce = 0,
  onSearchIndex = () => {
    /* noop */
  },
  onSearching = () => {
    /* noop */
  },
  onSearchClose,
  onGotoResult,
  onSearchTextChange,
}: DiffSearchProps<P>): React.ReactElement | null => {
  const [localSearchText, setLocalSearchText] = useState<string>(
    searchText ?? '',
  );

  const arrowsEnabled = searchResults.length <= 0;

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const debounceSearch = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends any[]>(func: (...args: T) => void, timeout = 300) => {
      return (...args: T) => {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          func(...args);
        }, timeout);
      };
    },
    [],
  );

  const focusInput = useCallback(() => {
    const $searchInput = document.getElementById(SEARCH_INPUT_ID) as
      | HTMLInputElement
      | undefined;

    $searchInput?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // highlight input text on initial render TODO: change to refs
  const handleSearchClose = useCallback(() => {
    onSearching(false);
    onSearchClose && onSearchClose();
  }, [onSearchClose, onSearching]);

  const scrollToSearchResult = useCallback(
    (searchResult: P) => {
      onGotoResult && onGotoResult(searchResult);
    },
    [onGotoResult],
  );

  const setNewSearchIndex = useCallback(
    (newSearchIndex: number) => {
      if (newSearchIndex >= 0) {
        const searchResult = searchResults[newSearchIndex];
        scrollToSearchResult(searchResult);
      }

      onSearchIndex(newSearchIndex);
    },
    [scrollToSearchResult, searchResults, onSearchIndex],
  );

  const decrementSearchIndex = useCallback(() => {
    setNewSearchIndex(
      searchIndex - 1 >= 0 ? searchIndex - 1 : searchResults.length - 1,
    );
  }, [searchIndex, searchResults.length, setNewSearchIndex]);

  const incrementSearchIndex = useCallback(() => {
    setNewSearchIndex((searchIndex + 1) % searchResults.length);
  }, [searchIndex, searchResults.length, setNewSearchIndex]);

  useHotkeys('Escape', (e) => {
    e.preventDefault();
    handleSearchClose();
  });

  useHotkeys('Enter', (e) => {
    e.preventDefault();
    if (e.shiftKey) {
      decrementSearchIndex();
      return;
    }
    incrementSearchIndex();
  });

  useHotkeys('cmd+f', (e) => {
    e.preventDefault();
    focusInput();
  });

  const handleSearchTextChange = useCallback(
    (newSearchText: string) => {
      if (onSearchTextChange) {
        onSearchTextChange(newSearchText);
        return;
      }
    },
    [onSearchTextChange],
  );

  useEffect(() => {
    focusInput();
    handleSearchTextChange(searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // we only want this to run on mount

  // for bigger diffs debounce interval is longer

  return (
    <div className={css.diffSearch}>
      <form className={css.textInput} onSubmit={incrementSearchIndex}>
        <TextInput
          size="small"
          id={SEARCH_INPUT_ID}
          className={css.searchInput}
          type="text"
          autoComplete="off"
          value={localSearchText}
          onInput={(e) => {
            setLocalSearchText(e.currentTarget.value ?? '');
            // TODO multiple print statements for results occur, is that a bug
            debounceSearch(
              handleSearchTextChange,
              debounce,
            )(e.currentTarget.value);
          }}
        />
      </form>
      <div className={css.index}>
        {searchResults.length > 0
          ? `${searchIndex + 1}/${searchResults.length}`
          : '0/0'}
      </div>

      <div className={css.buttons}>
        <IconButton
          style="secondary"
          tone="base"
          svg={ArrowUpSvg}
          disabled={arrowsEnabled}
          onClick={decrementSearchIndex}
          aria-label="Previous search result"
        />
        <IconButton
          style="secondary"
          tone="base"
          svg={ArrowDownSvg}
          disabled={arrowsEnabled}
          onClick={incrementSearchIndex}
          aria-label="Next search result"
        />
        <IconButton
          style="secondary"
          tone="base"
          svg={CancelSvg}
          onClick={handleSearchClose}
          aria-label="Cancel search"
        />
      </div>
    </div>
  );
};

export default DiffSearch;
