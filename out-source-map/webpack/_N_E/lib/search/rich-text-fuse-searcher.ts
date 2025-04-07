import Fuse from 'fuse.js';
import { type DiffSide } from 'types/diffSide';
import { RichTextDiffChunk } from 'types/rich-text';

type MatchRangeTuple = [number, number];

const RICH_TEXT_FUSE_OPTIONS = {
  shouldSort: false,
  includeMatches: true,
  threshold: 0,
  ignoreLocation: true,
  useExtendedSearch: true,
  minMatchCharLength: 1,
  keys: ['text'],
};

export interface RichTextFuseDoc {
  pageNumber: number;
  side: DiffSide;
  text: string;
}

export type RichTextSearchResult = {
  item: RichTextFuseDoc;
  refIndex: number;
  matchRange: MatchRangeTuple;
};

export default class RightTextFuseSearcher {
  fuse: Fuse<RichTextFuseDoc>;

  constructor(
    leftPageChunks: RichTextDiffChunk[][],
    rightPageChunks: RichTextDiffChunk[][],
  ) {
    this.fuse = this.generateNewFuseInstance();
    this.buildSearchMap(leftPageChunks, rightPageChunks);
  }

  generateNewFuseInstance() {
    return new Fuse<RichTextFuseDoc>([], RICH_TEXT_FUSE_OPTIONS);
  }

  buildSearchMap(
    leftPageChunks: RichTextDiffChunk[][],
    rightPageChunks: RichTextDiffChunk[][],
  ) {
    leftPageChunks.map((chunksOnPage, pageNumber) => {
      const doc = this.createFuseDoc(chunksOnPage, pageNumber, 'left');
      this.fuse.add(doc);
    });
    rightPageChunks.map((chunksOnPage, pageNumber) => {
      const doc = this.createFuseDoc(chunksOnPage, pageNumber, 'right');
      this.fuse.add(doc);
    });
  }

  createFuseDoc(
    chunksOnPage: RichTextDiffChunk[],
    pageNumber: number,
    side: DiffSide,
  ): RichTextFuseDoc {
    return chunksOnPage.reduce<RichTextFuseDoc>(
      (pageDocument, chunk) => {
        pageDocument.text += chunk.text.reduce((text, line) => text + line, '');
        return pageDocument;
      },
      { text: '', pageNumber, side },
    );
  }

  rebuildSearchMap(
    leftPageChunks: RichTextDiffChunk[][],
    rightPageChunks: RichTextDiffChunk[][],
  ) {
    this.fuse = this.generateNewFuseInstance();
    this.buildSearchMap(leftPageChunks, rightPageChunks);
  }

  getMatchIndices(substring: string, string: string): MatchRangeTuple[] {
    const indices = [];
    let startIndex = 0;

    while (
      (startIndex = string
        .toLocaleLowerCase()
        .indexOf(substring.toLocaleLowerCase(), startIndex)) > -1
    ) {
      const endIndex = startIndex + substring.length - 1;
      indices.push([startIndex, endIndex] as MatchRangeTuple);
      startIndex += substring.length;
    }

    return indices;
  }

  search(needle: string) {
    /**
     * Sadly two we have to do this to Fuse.js's output for the following reasons:
     * 1. The indices provided by fuse (we called it matchRange) aren't perfect matches
     * 2. The result set, gives us the set of resulting documents, with a set of matches in them, we
     * want to flatten all the matches into individual results
     */
    return this.fuse.search(needle).reduce((acc, result) => {
      const matches = this.getMatchIndices(needle, result.item.text);
      return acc.concat(
        matches.map((match) => ({
          item: result.item,
          refIndex: result.refIndex,
          matchRange: match,
        })),
      );
    }, [] as RichTextSearchResult[]);
  }
}
