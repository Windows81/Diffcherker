import { RichTextDiffChunk } from 'types/rich-text';

const groupTextIntoPages = (
  allChunks: RichTextDiffChunk[],
  pageCount: number,
): RichTextDiffChunk[][] => {
  const pages: RichTextDiffChunk[][] = [];

  let currPage: RichTextDiffChunk[] = [];
  let pageIndex = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];

    if (chunk.pageIndex > pageIndex) {
      pageIndex = handleNewPage(pages, currPage, pageIndex, chunk.pageIndex);
      currPage = [];
    }
    currPage.push(chunk);
  }

  pages.push(currPage);

  if (pages.length < pageCount) {
    for (let i = pages.length; i < pageCount; i++) {
      pages.push([]);
    }
  }

  return pages;
};

const handleNewPage = (
  pages: RichTextDiffChunk[][],
  currPage: RichTextDiffChunk[],
  currIndex: number,
  nextIndex: number,
): number => {
  const numPagesSkipped = nextIndex - currIndex;
  pages.push(currPage);
  for (let j = 1; j < numPagesSkipped; j++) {
    pages.push([]);
  }
  return nextIndex;
};

export default groupTextIntoPages;
