import {
  defaultRedlineOutputSettings,
  RedlineOutputSettingsObject,
} from 'components/new/redline-output/settings';
import ipcEvents from 'ipc-events';
import {
  isMicrosoftWordInstalled,
  isMicrosoftWordInstalledMac,
} from 'lib/check-editor-installation';
import { PdfDiffOutputTypes } from 'lib/output-types';
import Tracking from 'lib/tracking';
import { DiffInputType } from 'types/diff-input-type';
import { WordDocumentInfo } from 'types/word-doc-info';
import { WordRedlineResponse } from 'types/word-redline-response';
import { ElectronError } from 'types/electron-error';
import { RedlineErrorMessages } from 'lib/redline/redline-error-messages';

export const checkRedlinePrerequisites = async () => {
  // Redline is only available on desktop
  if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
    Tracking.trackEvent('Redline prerequisites check failed', {
      redlinePrerequisitesCheck: 'user not on desktop',
    });
    throw new Error(RedlineErrorMessages.NOT_DESKTOP);
  }

  // Redline requires Microsoft Word to be installed
  const isWindows = window.machine.platform === 'win32';
  if (isWindows) {
    if (!(await isMicrosoftWordInstalled())) {
      Tracking.trackEvent('Redline prerequisites check failed', {
        redlinePrerequisitesCheck: 'word not installed (windows)',
      });
      throw new Error(RedlineErrorMessages.WINDOWS_WORD_NOT_INSTALLED);
    }
  } else {
    if (!(await isMicrosoftWordInstalledMac())) {
      Tracking.trackEvent('Redline prerequisites check failed', {
        redlinePrerequisitesCheck: 'word not installed (mac)',
      });
      throw new Error(RedlineErrorMessages.MAC_WORD_NOT_INSTALLED);
    }
  }
};

export const redlineWord = async (
  documentInfo1: WordDocumentInfo,
  documentInfo2: WordDocumentInfo,
  options: RedlineOutputSettingsObject = defaultRedlineOutputSettings,
): Promise<WordDocumentInfo> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;
  const isWindows = window.machine.platform === 'win32';

  Tracking.trackEvent('Started redline diff', {
    diffInputType: DiffInputType.PDF,
    diffOutputType: PdfDiffOutputTypes.Redline,
    fileTypeOne: documentInfo1.fileType,
    fileTypeTwo: documentInfo2.fileType,
  });

  const ipcArgs = [documentInfo1, documentInfo2, options];

  if (isWindows) {
    const microsoftPrintToPdfInstalled = await ipcRenderer.invoke(
      ipcEvents.APP__HAS_MICROSOFT_PRINT_TO_PDF,
    );

    Tracking.trackEvent('Microsoft Print to PDF installed status', {
      microsoftPrintToPdfInstalled: microsoftPrintToPdfInstalled,
    });

    const response: WordRedlineResponse = await ipcRenderer.invoke(
      ipcEvents.APP__WORD_REDLINE,
      ipcArgs,
    );
    if (!response.success) {
      const error = ElectronError.fromJSON(response.errorInfo);
      throw error;
    }
    return response.wordDocumentInfo;
  } else {
    const response: WordRedlineResponse = await ipcRenderer.invoke(
      ipcEvents.APP__MAC_WORD_REDLINE,
      ipcArgs,
    );
    if (!response.success) {
      const error = ElectronError.fromJSON(response.errorInfo);
      throw error;
    }
    return response.wordDocumentInfo;
  }
};
