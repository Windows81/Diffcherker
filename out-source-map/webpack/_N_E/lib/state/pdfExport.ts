import { atom, useAtomValue, useSetAtom } from 'jotai';
import * as ReactDOM from 'react-dom';
import * as electron from './electron';
import ipcEvents from 'ipc-events';

enum PdfExportState {
  /**
   * No PDF export is occurring. Proceed as normal.
   */
  IDLE,

  /**
   * Browser should put the page in a prepared state. This means doing
   * anything that is necessary to do _before_ the PDF is generated.
   * This phase may result in some UI flashes if done on-screen. In the
   * future perhaps this will take place in an off-screen BrowserView.
   *
   * There is currently only a single render cycle to perform this work
   * and once all the updates have been flushed to DOM the PDF is built
   * and shown to the user.
   */
  PREPARING,
}

const pdfExportStateAtom = atom(PdfExportState.IDLE);

const pdfExportAtom = atom(null, (get, set) => {
  const state = get(pdfExportStateAtom);
  if (state !== PdfExportState.IDLE) {
    return;
  }
  set(pdfExportStateAtom, PdfExportState.PREPARING);
  setTimeout(() => {
    ReactDOM.flushSync(async () => {
      try {
        if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
          await electron.invoke(ipcEvents.APP__EXPORT_TO_PDF);
        } else {
          window.print();
        }
      } finally {
        set(pdfExportStateAtom, PdfExportState.IDLE);
      }
    });
  }, 0);
});

const pdfExportIsExportingAtom = atom((get) => {
  const state = get(pdfExportStateAtom);
  return state !== PdfExportState.IDLE;
});

export const usePdfIsExporting = () => {
  return useAtomValue(pdfExportIsExportingAtom);
};

export const usePdfExport = () => {
  return useSetAtom(pdfExportAtom);
};
