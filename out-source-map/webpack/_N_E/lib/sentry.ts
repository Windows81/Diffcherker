import * as Sentry from '@sentry/node';
import { type CaptureContext } from '@sentry/types';
import Tracking from './tracking';

export const init = (): void => {
  Sentry.init({
    environment:
      process.env.NODE_ENV === 'production' ? 'production' : 'development',
    enabled: process.env.NODE_ENV === 'production' && Tracking.allowedToTrack,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_PUBLIC,
    ignoreErrors: [
      /.*ResizeObserver.*/,
      'Non-Error promise rejection captured with value: undefined',
      /**
       * This error is caused by bad adblocker scripts that error out
       * the console through trying to redefine certain functions to noops.
       * Known example of an extension that can reproduce:
       * https://chrome.google.com/webstore/detail/adblocker-stands/lgblnfidahcdcjddiepkckcfdhpknnjh
       * Go to https://trello.com/c/OoznPOgR/440-sentry-ignore-cannot-redefine-errors-caused-by-bad-adblocks
       * for an example of sample adblock code that causes this error.
       * Despite sentry showing handled: false, the app still works as expected.
       */
      'Cannot redefine property: websredir',
      // Similar to the above, but for Google Analytics.
      'Cannot redefine property: googletag',
      /**
       * This error is related to a backend next js issue, where a mismatch of locales
       * between the detected locale from the request query and the path of the url.
       * It is suspected that this is only caused by bots scraping the website, since
       * the diffs being accessed tend to be extremely old.
       * The error shouldn't be critical and shouldn't affect the user experience.
       * (Tested by manually accessing saved diffs with different manually set locales.)
       */
      /The detected locale does not match the locale in the query/,
    ],
    // In the web environment, restrict error reporting to our specified domains to filter out ad-related errors.
    // In Electron, allow all errors so that issues (including C# errors) are fully reported.
    ...(process.env.NEXT_PUBLIC_IS_ELECTRON
      ? {}
      : {
          allowUrls: [
            /^https?:\/\/(www\.)?diffchecker\.com/,
            /^https?:\/\/[\w-]+\.herokuapp\.com/,
            /^https?:\/\/localhost(:\d+)?/,
          ],
        }),
    release: process.env.COMMIT_HASH,
  });

  if (typeof window !== 'undefined' && window.appVersion) {
    Sentry.setTag('releaseVersion', window.appVersion);
  }
};

export const captureException = (
  exception: unknown,
  captureContext?: CaptureContext,
): string => {
  return Sentry.captureException(exception, captureContext);
};

export const captureMessage = (
  exception: string,
  captureContext?: CaptureContext | Sentry.SeverityLevel,
): string => {
  return Sentry.captureMessage(exception, captureContext);
};
export const flush = (time: number): Promise<boolean> | void => {
  if (typeof Sentry.flush !== 'undefined') {
    return Sentry.flush(time);
  } else {
    return console.log('Flushing with time', time);
  }
};
