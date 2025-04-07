import { atom } from 'jotai';

const createSettingsAtom = () => atom({});

export const gitDiffDocumentCreateAtom = {
  createSettingsAtom,
  createWorkerDataAtom: () => {
    return atom(null);
  },
  createDiffDataAtom: () => {
    return atom<null>(null);
  },
};
