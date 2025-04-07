import { createSelector } from '@reduxjs/toolkit';
import { type State } from 'redux/store';

const selectSelf = (state: State) => state;

export const getCommentThreads = createSelector(selectSelf, (state) => {
  const currDiff = state.diff.diffs[state.diff.diffs.length - 1];
  if (currDiff && currDiff.slug === state.diff.commentThreadsLoadedForSlug) {
    return state.diff.commentThreads;
  }
  return [];
});
