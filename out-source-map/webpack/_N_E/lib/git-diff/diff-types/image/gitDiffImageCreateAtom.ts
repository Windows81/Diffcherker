import { atom } from 'jotai';
import type { GitDiffImageResult } from './gitDiffImage';

const createSettingsAtom = () =>
  atom({
    color: 'green',
  });

export const gitDiffImageCreateAtom = {
  createSettingsAtom,
  createWorkerDataAtom: () => {
    return atom(null);
  },
  createDiffDataAtom: () => {
    return atom<null | GitDiffImageResult>(null);
  },
};
