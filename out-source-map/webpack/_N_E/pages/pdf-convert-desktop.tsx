import Page from 'components/page';
import ipcEvents from 'ipc-events';
import { loConvert } from 'lib/convert/pdf/lo-wasm/libreoffice-wasm';
import ErrorPage from 'next/error';

interface Result {
  id: string;
}

export interface SuccessResult extends Result {
  data: ArrayBuffer;
}

export interface ErrorResult extends Result {
  error: Error;
}

export type ConversionResult = SuccessResult | ErrorResult;

if (typeof window !== 'undefined') {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;
  ipcRenderer.on(
    ipcEvents.APP__CONVERT_PDF,
    (_event, replyChannel, { fileName, data, loWasmBase }) => {
      loConvert(fileName, data, loWasmBase)
        .then((data) => {
          window.ipcRenderer.send(replyChannel, false, data);
        })
        .catch((error: Error) => {
          window.ipcRenderer.send(replyChannel, true, error);
        });
    },
  );
}

const PdfConvertDesktop: React.FC = () => {
  return <Page name="PDF Convert" hasHeader={false} />;
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : PdfConvertDesktop;
