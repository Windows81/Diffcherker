import { Atom, atom } from 'jotai';
import { GitDiffDataText } from './types';

interface GitDiffTextSettings {
  unfolded: boolean;
  level: 'word' | 'character';
  mode: 'split' | 'unified';
}

const createSettingsAtom = () => {
  return atom<GitDiffTextSettings>({
    unfolded: false,
    level: 'word',
    mode: 'split',
  });
};

const createWorkerDataAtom = (settingsAtom: Atom<GitDiffTextSettings>) => {
  return atom((get) => {
    const settings = get(settingsAtom);
    return {
      level: settings.level,
    };
  });
};

const createDiffDataAtom = () => {
  return atom<null | GitDiffDataText>(null);
};

export const gitDiffTextCreateAtom = {
  createSettingsAtom,
  createWorkerDataAtom,
  createDiffDataAtom,
};
