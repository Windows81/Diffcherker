import ipcEvents from 'ipc-events';

export const fetchLocalFolder = async (path: string) => {
  const response = await window.ipcRenderer.invoke(
    ipcEvents.APP__FETCH_LOCAL_DIR,
    path,
  );

  return response;
};
