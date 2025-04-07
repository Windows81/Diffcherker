import ipcEvents from 'ipc-events';
import { PdfConversionMedium, PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';
import { DefaultError } from 'types/conversion-errors';
import { exceptionHandler } from '../convert-to-pdf';

const convert = async (
  documentInfo: WordDocumentInfo,
): Promise<PdfConversionResult> => {
  const { data, fileName } = documentInfo;

  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

  try {
    const result = await ipcRenderer.invoke(ipcEvents.APP__CONVERT_PDF, {
      data,
      fileName,
    });
    return { data: result, medium: PdfConversionMedium.LO_WASM, documentInfo };
  } catch (err) {
    exceptionHandler(err as Error, PdfConversionMedium.LO_WASM);
    throw new DefaultError();
  }
};

export default convert;
