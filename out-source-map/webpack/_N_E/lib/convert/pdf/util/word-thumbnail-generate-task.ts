import { WordDocumentInfo } from 'types/word-doc-info';
import Tracking from 'lib/tracking';
import { PasswordProtectedError, TimeoutError } from 'types/conversion-errors';
import passwordHandler from './password-handler';
import { isMicrosoftWordInstalled } from 'lib/check-editor-installation';
import wordconvConvert from 'web/lib/convert/pdf/wordconv/convert';
import { AbortError } from 'lib/abort-error';
import { convertRouteRequest, ConvertToPdfOptions } from '../convert-to-pdf';
import { checkIfShouldPrintOut } from 'lib/check-microsoft-print-out';

export type ThumbnailGenerateResult = {
  thumbnailUrl?: string;
  thumbnailRawDocument?: {
    data: ArrayBuffer;
    wordDocumentInfo: WordDocumentInfo;
  };
};

export type ThumbnailTaskCallbacks = {
  onPassword: (firstTry: boolean) => void;
  onLoadStart?: () => void;
  onLoad: (result: ThumbnailGenerateResult) => void;
  onError?: (error: Error) => void;
};

// This task is responsible for creating thumbnails for docx files
// It is also handles data decryption for password protected files
class WordThumbnailGenerateTask {
  private wordDocumentInfo: WordDocumentInfo;
  private callbacks: ThumbnailTaskCallbacks;
  private isDestroyed = false;

  public constructor(
    wordDocumentInfo: WordDocumentInfo,
    callbacks: ThumbnailTaskCallbacks,
  ) {
    this.wordDocumentInfo = wordDocumentInfo;
    this.callbacks = callbacks;

    Tracking.trackEvent('Started thumbnail loading', {
      type: this.wordDocumentInfo.fileType,
    });

    this.generate();
  }

  public async generate() {
    try {
      this.checkAbort();
      // ! WARNING: this line is a side effect and will alter the original documentInfo var
      // Decrypt password protected documents if necessary
      this.wordDocumentInfo.data = await passwordHandler(this.wordDocumentInfo);

      this.checkAbort();
      this.callbacks.onLoadStart?.();

      this.checkAbort();
      let result: ThumbnailGenerateResult;
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        result = await this.getDesktopThumbnail();
      } else {
        const thumbnail = await this.fetchAzureThumbnail(this.wordDocumentInfo);
        result = { thumbnailUrl: thumbnail.url };
      }

      this.checkAbort();
      this.callbacks.onLoad?.(result);

      Tracking.trackEvent('Completed thumbnail loading', {
        type: this.wordDocumentInfo.fileType,
      });
    } catch (e) {
      const err = e as Error;

      if (err instanceof AbortError) {
        return;
      }

      if (err instanceof PasswordProtectedError) {
        this.callbacks.onPassword?.(
          this.wordDocumentInfo.password === undefined,
        );
        return;
      }

      if (err instanceof TimeoutError) {
        this.callbacks.onLoad?.({ thumbnailUrl: 'unavailable-thumbnail' });
        return;
      }

      this.callbacks.onError?.(err);

      Tracking.trackEvent('Failed thumbnail loading', {
        reason: err.message,
      });
    }
  }

  private async getDesktopThumbnail(): Promise<ThumbnailGenerateResult> {
    if (
      window.machine.platform === 'win32' &&
      (await isMicrosoftWordInstalled())
    ) {
      const options: ConvertToPdfOptions = {
        acceptAllRevisions: true,
      };
      if (this.wordDocumentInfo.filePath?.endsWith('.docx')) {
        options.pageFrom = 1;
        options.pageTo = 1;
      } else {
        // we use a safer export method for non-docx files since they sometimes fail
        options.shouldPrintOut = await checkIfShouldPrintOut();
      }

      const pdfConvertResult = await wordconvConvert(
        this.wordDocumentInfo,
        options,
      );
      return {
        thumbnailRawDocument: {
          data: pdfConvertResult.data,
          wordDocumentInfo: pdfConvertResult.documentInfo,
        },
      };
    } else {
      // on every other platform we try to leverage filesystem preview feature
      return {
        thumbnailUrl: `thumbnail:///${encodeURIComponent(
          this.wordDocumentInfo.filePath ?? '',
        )}`,
      };
    }
  }

  private async fetchAzureThumbnail(
    documentInfo: WordDocumentInfo,
  ): Promise<{ url: string }> {
    const response = await convertRouteRequest('thumbnail', documentInfo, {
      responseType: 'arraybuffer',
    });

    const blob = new Blob([response.data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    return {
      url,
    };
  }

  public updatePassword(password: string) {
    // TODO not sure if this updates the appropriate worddocumentinfo instances hosted in the react state
    //      as long as we don't need the password further down the line it should be fine
    //      the reason things still work is because the DECRYPTED data is being set properly in the react state
    //      however that's also sketchy since it's being done via a side effect
    //      either way, we should probably look into refactoring this entire class to not have side effects
    // ! WARNING: this line is a side effect and will alter the original documentInfo var
    this.wordDocumentInfo.password = password;
    this.generate();
  }

  public destroy() {
    this.isDestroyed = true;
  }

  private checkAbort() {
    if (this.isDestroyed) {
      throw new AbortError();
    }
  }
}

export default WordThumbnailGenerateTask;
