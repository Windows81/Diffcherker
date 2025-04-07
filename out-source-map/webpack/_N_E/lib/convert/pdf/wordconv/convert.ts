import ipcEvents from 'ipc-events';
import { PdfConversionMedium, PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';
import { ConvertToPdfOptions } from '../convert-to-pdf';

type WordConversionResult = {
  data: ArrayBuffer;
  fileId: string;
  pageCount: number;
};

const convert = async (
  documentInfo: WordDocumentInfo,
  options: ConvertToPdfOptions,
): Promise<PdfConversionResult> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

  let shouldPrintOut = false;
  if (options?.shouldPrintOut) {
    // TODO this call might be redundant if we can pass it in earlier from a parent call
    //      or we can just handle this in single electron call instead of 2
    const hasMicrosoftPrintToPdf: boolean = await ipcRenderer.invoke(
      ipcEvents.APP__HAS_MICROSOFT_PRINT_TO_PDF,
    );
    shouldPrintOut = options.shouldPrintOut && hasMicrosoftPrintToPdf;
  }

  const result: WordConversionResult = await ipcRenderer.invoke(
    ipcEvents.APP__WORD_CONVERSION,
    [
      documentInfo,
      {
        ...options,
        shouldPrintOut,
      },
    ],
  );

  if (result instanceof Error) {
    throw result;
  }

  // WARNING: this a side effect and affects the original callers var
  documentInfo.pageCount = result.pageCount;

  return {
    data: result.data,
    medium: PdfConversionMedium.MS_WORD,
    documentInfo,
  };
};

export default convert;
