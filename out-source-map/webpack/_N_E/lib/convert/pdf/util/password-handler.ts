import ipcEvents from 'ipc-events';
import path from 'pathe';
import { WordDocumentInfo } from 'types/word-doc-info';
import { convertRouteRequest } from '../convert-to-pdf';
import { PasswordProtectedError } from 'types/conversion-errors';

const SUPPORTED_TYPES = {
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const electronPasswordHandler = async (
  documentInfo: WordDocumentInfo,
): Promise<ArrayBuffer> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

  const isProtected =
    !!documentInfo.password ||
    (await ipcRenderer.invoke(ipcEvents.APP__CHECK_PASSWORD_PROTECTED, [
      documentInfo,
    ]));

  if (isProtected && !documentInfo.password) {
    throw new PasswordProtectedError();
  }
  if (isProtected && documentInfo.password) {
    const response = await ipcRenderer.invoke(
      ipcEvents.APP__UNLOCK_PASSWORD_PROTECTED,
      [documentInfo],
    );

    // PasswordProtectedError will be typed as Error after IPC serialization
    if (response instanceof Error) {
      const passwordError = new PasswordProtectedError();
      if (response.message === passwordError.message) {
        throw passwordError;
      }
      throw response;
    }

    return response;
  }

  return documentInfo.data;
};

const webPasswordHandler = async (
  documentInfo: WordDocumentInfo,
): Promise<ArrayBuffer> => {
  let isProtected = !!documentInfo.password;
  if (!isProtected) {
    const response = await convertRouteRequest('encrypted', documentInfo);
    isProtected = response.data;
  }

  if (isProtected && !documentInfo.password) {
    throw new PasswordProtectedError();
  }
  if (isProtected && documentInfo.password) {
    const response = await convertRouteRequest('decrypt', documentInfo, {
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  return documentInfo.data;
};

const passwordHandler = async (
  documentInfo: WordDocumentInfo,
): Promise<ArrayBuffer> => {
  // Check both extension and mimetype due to certain cases where a Word mimetype is assigned to a non-Word file
  const supported =
    Object.keys(SUPPORTED_TYPES).includes(
      path.extname(documentInfo.fileName),
    ) && Object.values(SUPPORTED_TYPES).includes(documentInfo.fileType);
  if (!supported) {
    return documentInfo.data;
  }

  if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return electronPasswordHandler(documentInfo);
  }
  return webPasswordHandler(documentInfo);
};

export default passwordHandler;
