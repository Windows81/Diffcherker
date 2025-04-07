import path from 'pathe';

declare global {
  interface Window {
    Module?: ModuleType;
  }
}

type ModuleType = {
  preRun: (() => void)[];
  postRun: (() => void)[];
  print: (text: string) => void;
  printErr: (text: string) => void;
  locateFile: (path: string) => string;
  setStatus?: (status: string) => void;
  FS?: {
    writeFile: (path: string, data: string | ArrayBufferView) => void;
    readFile: (
      path: string,
      opts?: { encoding: string },
    ) => string | Uint8Array;
  };
  arguments?: string[];
};

export const loConvert = async (
  fileName: string,
  data: ArrayBuffer,
  loWasmBase: string,
): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>(async (resolve, reject) => {
    // eslint-disable-next-line prefer-const
    let cleanup: () => void | undefined;
    let result: ArrayBuffer | undefined;

    window.Module = {
      preRun: [],
      postRun: [],
      print: () => {
        return; // Ignore stdout
      },
      printErr: (text) => {
        if (
          text ===
          'Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread'
        ) {
          // Ignore main thread blocking error for now.
          // TODO: We should try make our WASM solution non-blocking in the future.
          return;
        }
        reject(text);
      },
      locateFile: (path) => {
        return `${loWasmBase}/${path}`;
      },
    };

    window.Module.preRun.push(() => {
      const extension = path.extname(fileName).slice(1);
      const file = `file.${extension}`;
      window.Module?.FS?.writeFile(file, new Uint8Array(data));
      window.Module?.arguments?.push('/' + file);
    });

    window.Module.postRun.push(() => {
      const outData = window.Module?.FS?.readFile('/file.pdf', {
        encoding: 'binary',
      });
      if (!outData) {
        reject(
          new Error('Failed reading file from Emscripten virtual file system.'),
        );
      } else if (typeof outData === 'string') {
        throw new Error('Expected binary data, got string.');
      } else {
        // @ts-ignore
        result = outData.buffer;
      }
      if (result === undefined) {
        throw new Error('Failed to convert file.');
      }
      if (!cleanup) {
        return;
      }
      cleanup();
      resolve(result);
    });

    cleanup = await loadScript(loWasmBase);
    if (!result) {
      return;
    }
    cleanup();
    resolve(result);
  });
};

const loadScript = async (loWasmBase: string) => {
  const iframe = window.document.createElement('iframe');
  iframe.style.display = 'none';

  iframe.onload = async () => {
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      throw new Error('Failed to load iframe window.');
    }

    iframeWindow.Module = window.Module;

    const script = iframeWindow.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `${loWasmBase}/soffice.js`;

    // Hacky workaround to disable automatic downloads triggered on pdf conversion
    iframeWindow.document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('download') !== null) {
        event.preventDefault();
      }
    });

    iframeWindow.document.body.appendChild(script);
  };

  window.document.body.appendChild(iframe);

  return () => {
    iframe.remove();
  };
};
