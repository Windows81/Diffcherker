import ipcEvents from 'ipc-events';

type FetchLocalFileAsTextResponse =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      error: {
        code: string;
      };
    };

export const fetchLocalFileAsText = async (
  path: string,
): Promise<FetchLocalFileAsTextResponse> => {
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

  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(new Uint8Array(response.data));

  return {
    ok: true,
    text,
  };
};
