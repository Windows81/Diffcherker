import { atom, useAtomValue } from 'jotai';
import * as electron from './electron';
import ipcEvents from 'ipc-events';

const internalFullscreenAtom = atom(false);
internalFullscreenAtom.onMount = (setAtom) => {
  return electron.on(ipcEvents.APP__TOGGLE_FULLSCREEN, (_evt, state) => {
    setAtom(state);
  });
};

const fullscreenAtom = atom((read) => read(internalFullscreenAtom));

export const useIsFullscreen = () => {
  return useAtomValue(fullscreenAtom);
};
