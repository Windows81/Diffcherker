import { atom } from 'jotai';

const createSettingsAtom = () => atom({});

export const gitDiffSpreadsheetCreateAtom = {
  createSettingsAtom,
  createWorkerDataAtom: () => {
    return atom(null);
  },
  createDiffDataAtom: () => {
    return atom<null>(null);
  },
};
