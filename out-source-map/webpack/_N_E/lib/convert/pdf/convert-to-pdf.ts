import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import createApiUrl from 'lib/create-api-url';
import Tracking from 'lib/tracking';
import { captureException } from 'lib/sentry';
import wordconvConvert from 'web/lib/convert/pdf/wordconv/convert';
import macPagesConvert from 'web/lib/convert/pdf/mac-pages/convert';
import macWordConvert from 'web/lib/convert/pdf/mac-wordconv/convert';
import loWasmPdfConvert from 'web/lib/convert/pdf/lo-wasm/convert';
import webConvert from 'web/lib/convert/pdf/web/convert';
import { PdfConversionMedium, PdfConversionResult } from 'types/pdf-conversion';

import { WordDocumentInfo } from 'types/word-doc-info';
import {
  DefaultError,
  FileSizeError,
  PasswordProtectedError,
  TimeoutError,
} from 'types/conversion-errors';
import {
  isMicrosoftWordInstalled,
  isMicrosoftWordInstalledMac,
  isPagesInstalledMac,
} from 'lib/check-editor-installation';

const conversionHandler = {
  [PdfConversionMedium.MS_WORD]: wordconvConvert,
  [PdfConversionMedium.MAC_PAGES]: macPagesConvert,
  [PdfConversionMedium.MAC_MS_WORD]: macWordConvert,
  [PdfConversionMedium.LO_WASM]: loWasmPdfConvert,
  [PdfConversionMedium.API]: webConvert,
};

export const exceptionHandler = (error: Error, medium: PdfConversionMedium) => {
  captureException(error, {
    tags: {
      action: `convertToPdf`,
      medium,
    },
  });
};

export type ConvertToPdfOptions = {
  shouldPrintOut?: boolean; // use microsoft's "print to PDF" for conversion
  pageFrom?: number;
  pageTo?: number;
  macRedline?: boolean;
  acceptAllRevisions?: boolean;
};

export const convertToPdf = async (
  documentInfo: WordDocumentInfo,
  options: ConvertToPdfOptions = {},
): Promise<PdfConversionResult> => {
  // Redirect conversions to the API if on the web
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    return await conversionHandler[PdfConversionMedium.API](documentInfo);
  }

  // Try to convert to PDF using Microsoft Word (if on Windows and Word is available)
  if (
    window.machine.platform === 'win32' &&
    (await isMicrosoftWordInstalled())
  ) {
    try {
      return await conversionHandler[PdfConversionMedium.MS_WORD](
        documentInfo,
        options,
      );
    } catch (err) {
      exceptionHandler(err as Error, PdfConversionMedium.MS_WORD);
      Tracking.trackEvent('Failed PDF conversion', {
        reason: 'ms-word-failure',
      });
    }
  } else if (window.machine.platform === 'darwin') {
    if (options.macRedline) {
      try {
        return await conversionHandler[PdfConversionMedium.LO_WASM](
          documentInfo,
        );
      } catch (err) {
        return await conversionHandler[PdfConversionMedium.MAC_PAGES](
          documentInfo,
        );
      }
    } else if (await isPagesInstalledMac()) {
      try {
        window.store.set('app.askedMacPagesPermissions', true);
        return await conversionHandler[PdfConversionMedium.MAC_PAGES](
          documentInfo,
        );
      } catch (err) {
        exceptionHandler(err as Error, PdfConversionMedium.MAC_PAGES);
        Tracking.trackEvent('Failed PDF conversion', {
          reason: 'pages-failure',
        });
      }
    } else if (await isMicrosoftWordInstalledMac()) {
      try {
        window.store.set('app.askedMacWordPermissions', true);
        return await conversionHandler[PdfConversionMedium.MAC_MS_WORD](
          documentInfo,
        );
      } catch (err) {
        exceptionHandler(err as Error, PdfConversionMedium.MAC_MS_WORD);
        Tracking.trackEvent('Failed PDF conversion', {
          reason: 'ms-word-mac-failure',
        });
      }
    } else {
      Tracking.trackEvent('Failed PDF conversion', {
        reason: 'no-word-or-pages',
      });
    }
  }
  // Fallback to LibreOffice WASM
  return conversionHandler[PdfConversionMedium.LO_WASM](documentInfo);
};

export const convertRouteRequest = async (
  endpoint: string,
  documentInfo: WordDocumentInfo,
  config?: AxiosRequestConfig<ArrayBuffer>,
) => {
  const params = new URLSearchParams({
    fileName: documentInfo.fileName,
    fileType: documentInfo.fileType,
  });
  if (documentInfo.password) {
    params.append('password', documentInfo.password);
  }
  const url = `${createApiUrl(`/convert/${endpoint}`)}?${params.toString()}`;
  try {
    return await axios.post(url, documentInfo.data, {
      headers: { 'Content-Type': 'application/octet-stream' },
      ...config,
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    switch (axiosError.response?.status) {
      case 413:
        throw new FileSizeError();
      case 422:
        throw new PasswordProtectedError();
      case 503:
        // A 503 typically means a Heroku request timeout - https://devcenter.heroku.com/articles/request-timeout
        throw new TimeoutError();
      case 504:
        throw new TimeoutError();
      default:
        exceptionHandler(axiosError, PdfConversionMedium.API);
        throw new DefaultError();
    }
  }
};

export default convertToPdf;
