import { atom, useAtom, useAtomValue } from 'jotai';
import * as electron from './electron';

const darkModeInternalAtom = atom(electron.storeGet('app.darkMode') ?? false);

darkModeInternalAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('app.darkMode', (v) => setAtom(v));
};

const darkModeAtom = atom(
  (get) => get(darkModeInternalAtom),
  (_get, set, newDarkMode: boolean) => {
    set(darkModeInternalAtom, newDarkMode);
    electron.storeSet('app.darkMode', newDarkMode);
  },
);

export const useDarkMode = () => {
  return useAtom(darkModeAtom);
};

export const useDarkModeValue = () => {
  return useAtomValue(darkModeAtom);
};
