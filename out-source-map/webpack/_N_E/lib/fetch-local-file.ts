import ipcEvents from 'ipc-events';
import getNameFromFilePath from './get-name-from-file-path';

type FetchLocalFileResponse =
  | {
      ok: true;
      file: File;
    }
  | {
      ok: false;
      error: {
        code: string;
      };
    };

export const fetchLocalFile = async ({
  path,
  type,
}: {
  path: string;
  type?: string;
}): Promise<FetchLocalFileResponse> => {
  const response = await window.ipcRenderer.invoke(
    ipcEvents.APP__FETCH_LOCAL_FILE,
    path,
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
    };
  }

  const name = getNameFromFilePath(path);
  const file = new File([response.data], name, {
    type,
  });

  // Electron requires the path property to be set on the file
  // We can't set it on the file object since it's not writable
  // So we set it on the file object's prototype
  Object.defineProperty(file, 'path', {
    value: path,
    writable: false,
  });

  return {
    ok: true,
    file,
  };
};
