import { createSelector } from '@reduxjs/toolkit';

import { initialDiffState } from 'redux/modules/diff-module';
import { State } from 'redux/store';

export const getDiffs = ({ diff }: State) => diff.diffs;
export const getUserDiffs = ({ user }: State) => user.diffs;
const getDiffIndex = ({ diff }: State) => diff.diffIndex;

export const getDiff = createSelector(
  [getDiffs, getDiffIndex],
  (diffs, diffIndex) => {
    return diffIndex === -1 ? initialDiffState : diffs[diffIndex];
  },
);
