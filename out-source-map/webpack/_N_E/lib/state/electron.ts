// TODO(@izaakschroeder): evt is `keyof typeof ipcEvents`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const on = (
  evt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (evt: Electron.IpcRendererEvent, ...args: any[]) => void,
) => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  window.ipcRenderer.on(evt, handler);
  return () => window.ipcRenderer.removeListener(evt, handler);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const send = (evt: string, ...args: any[]) => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  window.ipcRenderer.send(evt, ...args);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invoke = (evt: string, ...args: any[]): Promise<any> | any => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  return window.ipcRenderer.invoke(evt, ...args);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storeGet = (name: string): undefined | any => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  return window.store.get(name);
};

export const storeSet = (name: string, value: unknown): void => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  window.store.set(name, value);
};

export const storeDelete = (name: string): void => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  window.store.delete(name);
};

export const webContentsIdGet = () => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  return window.webContentsId;
};

export const storeSubscribe = (
  name: string,
  fn: (v: unknown, old: unknown) => void,
) => {
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  return window.store.onDidChange(name, fn);
};
