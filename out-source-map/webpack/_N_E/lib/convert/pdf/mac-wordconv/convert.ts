import ipcEvents from 'ipc-events';
import { PdfConversionMedium, PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';

const convert = async (
  documentInfo: WordDocumentInfo,
): Promise<PdfConversionResult> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

  const result = await ipcRenderer.invoke(ipcEvents.APP__MAC_WORD_CONVERSION, [
    documentInfo,
  ]);

  if (result instanceof Error) {
    throw result;
  }

  return {
    data: result,
    medium: PdfConversionMedium.MAC_MS_WORD,
    documentInfo,
  };
};

export default convert;
