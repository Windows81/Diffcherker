import { captureException } from 'lib/sentry';
import { DiffInputType } from 'types/diff-input-type';
import { DiffSide } from 'types/diffSide';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export async function sendFileToBucket(
  file: File,
  sessionId: string,
  side: DiffSide,
  fileType: DiffInputType,
): Promise<void> {
  if (process.env.NEXT_PUBLIC_IS_ELECTRON || IS_DEVELOPMENT) {
    return;
  }

  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('side', side);
  formData.append('file', file);
  formData.append('fileType', fileType);
  formData.append('fileName', file.name);

  fetch(`${process.env.NEXT_PUBLIC_RRWEB_URL}/s3/upload-object`, {
    method: 'POST',
    body: formData,
  }).catch((error) => {
    captureException('Error sending file to s3 bucket', {
      contexts: {
        Context: {
          message: error.message,
          sessionId: sessionId,
          fileType: fileType,
          fileName: file.name,
        },
      },
    });
  });
}
