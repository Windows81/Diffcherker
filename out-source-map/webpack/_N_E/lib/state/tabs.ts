import * as React from 'react';
import ipcEvents from 'ipc-events';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import * as electron from './electron';

interface TabValue {
  id: string;
  active: boolean;
  label: string;
  icon: string;
}

const tabsInternalAtom = atom<TabValue[]>([]);
tabsInternalAtom.onMount = (setAtom) => {
  return electron.on(ipcEvents.APP__TAB_CHANGE, (_evt, state) => {
    setAtom(state);
  });
};

const tabsAtom = atom((read) => read(tabsInternalAtom));

export const tabActiveIdAtom = atom((get) => {
  return get(tabsAtom).find((entry) => entry.active)?.id;
});

const tabAtom = (id: string) => {
  return atom((get) => {
    return get(tabsAtom).find((tab) => tab.id === id);
  });
};

const tabOpenAtom = atom(
  null,
  (_get, _set, params: { id?: string; activate?: boolean; href: string }) => {
    electron.send(ipcEvents.APP__TAB_OPEN, params);
  },
);

const tabCloseAtom = atom(null, (_get, _set, id: string) => {
  electron.send(ipcEvents.APP__TAB_CLOSE, { id });
});

const tabActivateAtom = atom(null, (_get, _set, id: string) => {
  electron.send(ipcEvents.APP__TAB_ACTIVATE, { id });
});

const tabMoveAtom = atom(null, (_get, _set, id: string, before: string) => {
  electron.send(ipcEvents.APP__TAB_MOVE, { id, before });
});

export const useTabOpen = () => {
  return useSetAtom(tabOpenAtom);
};

export const useTabClose = () => {
  return useSetAtom(tabCloseAtom);
};

export const useTabActivate = () => {
  return useSetAtom(tabActivateAtom);
};

export const useTabMove = () => {
  return useSetAtom(tabMoveAtom);
};

export const useTab = (id: string) => {
  return useAtomValue(
    React.useMemo(() => {
      return tabAtom(id);
    }, [id]),
  );
};

export const useTabs = () => {
  return useAtomValue(tabsAtom);
};

export const useTabOpenMenu = () => {
  return React.useCallback((params: { x: number; y: number }) => {
    return electron.invoke(ipcEvents.APP__TAB_MENU, params);
  }, []);
};
