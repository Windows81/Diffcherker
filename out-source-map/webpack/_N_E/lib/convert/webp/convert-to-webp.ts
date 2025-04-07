import ipcEvents from 'ipc-events';
import {
  ConvertMessage,
  MessageType,
  WebPConversionWorker,
  OptionsMessage,
} from 'types/webp-conversion-worker';

const convertToWebP = async (
  fileName: string,
  buffer: ArrayBuffer,
  fileExtension: string,
): Promise<ArrayBuffer> => {
  const webPConversionWorker: WebPConversionWorker = new Worker(
    new URL('../../../lib/workers/webp-conversion/worker.ts', import.meta.url),
  );

  const optionsMessage: OptionsMessage = {
    type: MessageType.OPTIONS,
    appPath:
      process.env.NEXT_PUBLIC_IS_ELECTRON &&
      (await window.ipcRenderer.invoke(ipcEvents.APP__GET_PATH)),
    electronIsDev:
      !!process.env.NEXT_PUBLIC_IS_ELECTRON && window.electronIsDev,
  };
  webPConversionWorker.postMessage(optionsMessage);

  const convertMessage: ConvertMessage = {
    type: MessageType.CONVERT,
    fileName,
    buffer,
    fileExtension,
  };
  webPConversionWorker.postMessage(convertMessage, [buffer]);

  return new Promise((resolve, _reject) => {
    webPConversionWorker.onmessage = async (e) => {
      webPConversionWorker.terminate();
      resolve(e.data.buffer);
    };
  });
};

export default convertToWebP;
