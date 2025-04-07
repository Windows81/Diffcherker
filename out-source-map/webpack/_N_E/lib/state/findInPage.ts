import * as React from 'react';
import ipcEvents from '../../ipc-events';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as electron from './electron';
import { tabActiveIdAtom } from './tabs';
import { atomFamily } from 'jotai/utils';

interface FindInPageOptions {
  text?: string;
  forward?: boolean;
  matchCase?: boolean;
}

const findInPageAtomFamily = atomFamily((tabId) => {
  const internalActiveAtom = atom(false);
  return atom({
    tabId,
    activeAtom: atom(
      (get) => get(internalActiveAtom),
      (_get, set, value) => {
        if (value) {
          set(internalActiveAtom, true);
          return;
        }
        window.ipcRenderer.invoke(ipcEvents.APP__FIND_IN_PAGE, '', {}, tabId);
        set(internalActiveAtom, false);
      },
    ),
    paramsAtom: atom({
      text: '',
      forward: true,
      matchCase: false,
    }),
    resultsAtom: atom({
      matches: 0,
      activeMatchOrdinal: 0,
    }),
  });
});

const activateFindInPageAtom = atom(
  null,
  (get, set, active: boolean, tabId: number) => {
    const { activeAtom } = get(findInPageAtomFamily(tabId));
    set(activeAtom, active);
  },
);

const findInPageParamsAtom = atom(
  (get) => {
    const tabId = get(tabActiveIdAtom);
    const { paramsAtom } = get(findInPageAtomFamily(tabId));
    return get(paramsAtom);
  },
  (get, set, options: FindInPageOptions) => {
    const tabId = get(tabActiveIdAtom);
    const { paramsAtom } = get(findInPageAtomFamily(tabId));
    set(paramsAtom, { ...get(paramsAtom), ...options });
  },
);

const findInPageResultsAtom = atom((get) => {
  const tabId = get(tabActiveIdAtom);
  const { resultsAtom } = get(findInPageAtomFamily(tabId));
  return get(resultsAtom);
});

const findInPageActiveAtom = atom(
  (get) => {
    const tabId = get(tabActiveIdAtom);
    const { activeAtom } = get(findInPageAtomFamily(tabId));
    return get(activeAtom);
  },
  async (get, _set, value: boolean) => {
    const tabId = get(tabActiveIdAtom);
    await electron.invoke(ipcEvents.APP__FIND_IN_PAGE_ACTIVE, value, tabId);
  },
);

const findInPageAtom = atom(
  null,
  async (get, set, input?: FindInPageOptions) => {
    const tabId = get(tabActiveIdAtom);
    const { paramsAtom, resultsAtom, activeAtom } = get(
      findInPageAtomFamily(tabId),
    );
    const params = get(paramsAtom);
    const {
      text = params.text,
      forward = params.forward,
      matchCase = params.matchCase,
    } = input ?? {};

    const sameText = params.text === text;
    const sameDirection = params.forward === forward;
    const sameCase = params.matchCase === matchCase;

    const findNext = sameText && sameDirection && sameCase;
    const newParams = { ...params, ...input, findNext };
    set(activeAtom, true);
    set(paramsAtom, newParams);

    try {
      const result = await window.ipcRenderer.invoke(
        ipcEvents.APP__FIND_IN_PAGE,
        text,
        newParams,
        tabId,
      );
      set(resultsAtom, result);
    } catch (err) {
      // TODO(@izaakschroeder): Report error.
      return;
    }
  },
);

export const useFindInPage = () => {
  return useSetAtom(findInPageAtom);
};

export const useFindInPageActive = () => {
  return useAtom(findInPageActiveAtom);
};

export const useFindInPageParams = () => {
  return useAtomValue(findInPageParamsAtom);
};

export const useFindInPageResults = () => {
  return useAtomValue(findInPageResultsAtom);
};

export const useFindInPageEventListener = () => {
  const setState = useSetAtom(activateFindInPageAtom);
  React.useEffect(() => {
    return electron.on(
      ipcEvents.APP__FIND_IN_PAGE_ACTIVE,
      (_evt, active, tabId) => {
        setState(active, tabId);
      },
    );
  }, [setState]);
};
