import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import isPlatformMac from 'lib/is-platform-mac';

/**
 * All modifiers available to use as a combination in hotkeys
 * IMPORTANT: `cmd` is used as a platform agnostic way of targeting `ctrl (windows)` or `cmd (mac's meta)`
 * so it's easy to replace system hotkeys/shortcuts like ctrl+s/cmd+s or ctrl+f/cmd+f
 */
export type Modifier = 'cmd' | 'ctrl' | 'alt' | 'meta' | 'shift';
export type ModifierKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';

export type Hotkey = {
  key: string;
  modifierKeys: ModifierKey[];
};

export type HotkeyCallback = (keyboardEvent: KeyboardEvent) => void;

const validModifiers: Modifier[] = ['cmd', 'ctrl', 'alt', 'meta', 'shift'];

function parseKeys(hotkeysString: string) {
  const isMac = isPlatformMac();

  const hotkeysStringSplit = hotkeysString.split(',');
  return hotkeysStringSplit.map((hotkeyString) => {
    const hotkeyStringParts = hotkeyString.split('+');
    if (hotkeyStringParts.length === 1) {
      return {
        key: hotkeyStringParts[0],
        modifierKeys: [],
      };
    }

    return hotkeyStringParts.reduce(
      (hotkey, item) => {
        if (validModifiers.includes(item as Modifier)) {
          const modifier =
            item === 'cmd' ? (isMac ? 'meta' : 'ctrl') : (item as Modifier);
          hotkey.modifierKeys.push(`${modifier}Key` as ModifierKey);
        } else if (hotkey.key === '') {
          hotkey.key = item;
        } else {
          throw new Error(
            `Invalid modifier or only one regular key can be defined in a hotkey combination e.g. 'ctrl+j+k' is not allowed.`,
          );
        }
        return hotkey;
      },
      { key: '', modifierKeys: [] } as Hotkey,
    );
  });
}

function eventMatchesHotkeys(e: KeyboardEvent, hotkeys: Hotkey[]) {
  return hotkeys.some((hotkey) => {
    const keyMatches = hotkey.key === e.key;
    return (
      keyMatches &&
      hotkey.modifierKeys.every(
        (modifierKey: ModifierKey) => e[modifierKey] === true,
      )
    );
  });
}

export function useHotkeys<T extends HTMLElement>(
  hotkeysString: string,
  callback: HotkeyCallback = () => {
    /* noop */
  },
  dependencies?: unknown[],
) {
  const hasWindow = typeof window !== 'undefined';
  const useSafeLayoutEffect = hasWindow ? useLayoutEffect : useEffect;

  const ref = useRef<T>(null);
  const hotkeys = useRef<Hotkey[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoisedCallback = useCallback(callback, dependencies ?? []);
  const callbackRef = useRef<HotkeyCallback>(memoisedCallback);

  if (dependencies) {
    callbackRef.current = memoisedCallback;
  } else {
    callbackRef.current = callback;
  }

  callbackRef.current = callback;
  hotkeys.current = parseKeys(hotkeysString);

  useSafeLayoutEffect(() => {
    const el = ref.current ?? document;

    if (!el) {
      return;
    }

    const handleKeyDown = (e: Event) => {
      // The `as` is needed because of this open issue with Typescript: https://github.com/microsoft/TypeScript/issues/28357
      if (eventMatchesHotkeys(e as KeyboardEvent, hotkeys.current)) {
        callbackRef.current && callbackRef.current(e as KeyboardEvent);
      }
    };

    el.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return ref;
}
