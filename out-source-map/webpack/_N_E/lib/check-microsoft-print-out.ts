import { captureException } from '@sentry/node';
import ipcEvents from 'ipc-events';
import { devLog } from './logger';
import Tracking from './tracking';

export const checkIfShouldPrintOut = async (): Promise<boolean> => {
  let shouldPrintOut = true;

  /**
   * Temporary approach to avoid using Microsoft Print to PDF (by setting shouldPrintOut false)
   * when we are running windows with mac cpus (which exhibits a race condition when loading PDFs).
   * Added tracking and error logging to determine how many of our users this might be impacting.
   */
  if (
    process.env.NEXT_PUBLIC_IS_ELECTRON &&
    window.machine.platform === 'win32'
  ) {
    devLog('[REDLINE] checking if we should print out');
    const cpuModel = await window.ipcRenderer.invoke(
      ipcEvents.APP__GET_CPU_INFO,
    );
    if (cpuModel.includes('Apple')) {
      shouldPrintOut = false;
      captureException(
        'Perform Redline Word Conversion with Apple CPU detected',
      );
    }
    Tracking.trackEvent('Perform Redline Word Conversion', {
      type: cpuModel,
    });
  }
  return shouldPrintOut;
};
