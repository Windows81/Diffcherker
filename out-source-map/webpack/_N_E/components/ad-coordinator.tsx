import {
  diffcheckerDesktopNativeAd,
  svgviewerNativeAd,
  defaultGoogleAd,
  launchUiNativeAd,
  bibcitationNativeAd,
} from 'lib/custom-ads';
import Tracking from 'lib/tracking';
import { useState, useEffect, createContext, useCallback } from 'react';
import { getDiff } from 'redux/selectors/diff-selector';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { type NativeAd } from 'types/native-ad';

// network ads can be explicitly fetched via an api call
type NetworkAdZone =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'carbon';

// google ads have to be implicitly initialized via an external script load
type GoogleAdZone = 'googleCarbonFallback' | 'googleLeaderboard';

type AdZone = NetworkAdZone | GoogleAdZone;

const AD_ZONE_IDS: Record<AdZone, string> = {
  topLeft: 'CWYD553I',
  topRight: 'CWYI62JW',
  bottomLeft: 'CWYD553W',
  bottomRight: 'CWYD553M',
  carbon: 'CE7DC2Q7',
  googleCarbonFallback: 'bsa-zone_1726824813931-6_123456',
  googleLeaderboard: 'bsa-zone_1726824978687-4_123456',
};

const NETWORK_ADS_REQUEST_URL = `https://srv.buysellads.com/ads/get/ids/${[
  AD_ZONE_IDS.topLeft,
  AD_ZONE_IDS.topRight,
  AD_ZONE_IDS.bottomLeft,
  AD_ZONE_IDS.bottomRight,
  AD_ZONE_IDS.carbon,
].join(';')}.json`;

const fetchNetworkAds = async (
  timeoutOverride?: number,
): Promise<{ [K in NetworkAdZone]: NativeAd | undefined } | null> => {
  const timeout = timeoutOverride || 6 * 1000;

  try {
    const request = new Request(NETWORK_ADS_REQUEST_URL);
    const fetched = await fetchWithTimeout(request, { timeout });
    const response = await fetched.json();

    const [topLeft, topRight, bottomLeft, bottomRight, carbon] = [
      parseAd(response?.ads[AD_ZONE_IDS.topLeft]?.ads),
      parseAd(response?.ads[AD_ZONE_IDS.topRight]?.ads),
      parseAd(response?.ads[AD_ZONE_IDS.bottomLeft]?.ads),
      parseAd(response?.ads[AD_ZONE_IDS.bottomRight]?.ads),
      parseAd(response?.ads[AD_ZONE_IDS.carbon]?.ads),
    ];

    return {
      topLeft: topLeft && {
        ...topLeft,
        zoneId: AD_ZONE_IDS.topLeft,
        platform: 'native',
      },
      topRight: topRight && {
        ...topRight,
        zoneId: AD_ZONE_IDS.topRight,
        platform: 'native',
      },
      bottomLeft: bottomLeft && {
        ...bottomLeft,
        zoneId: AD_ZONE_IDS.bottomLeft,
        platform: 'native',
      },
      bottomRight: bottomRight && {
        ...bottomRight,
        zoneId: AD_ZONE_IDS.bottomRight,
        platform: 'native',
      },
      carbon: carbon && {
        ...carbon,
        zoneId: AD_ZONE_IDS.carbon,
        platform: 'carbon',
      },
    };
  } catch {
    return null;
  }
};

const parseAd = (ads: unknown[] | undefined): NativeAd | undefined => {
  return ads?.find(
    (ad: unknown): ad is NativeAd => !!(ad as NativeAd)?.statlink,
  );
};

export type AdPositions = {
  aboveForm?: { ads: (NativeAd | undefined)[] };
  aboveSubmit?: { ads: NativeAd[] };
  belowSubmit?: { ads: NativeAd[] };
  heroRight?: { ads: NativeAd[] };
  sidebar?: { ads: NativeAd[] };
};

export const AdCoordinatorContext = createContext<
  [AdPositions, React.Dispatch<React.SetStateAction<AdPositions>>]
>([{}, (_positions: React.SetStateAction<AdPositions>) => undefined]);

async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: Record<string, unknown> = {},
) {
  const { timeout: timeoutRawValue } = options;
  const timeout = Number(timeoutRawValue);

  const controller = new AbortController();
  const id = setTimeout(() => {
    Tracking.trackEvent('Ad request timed out');
    return controller.abort();
  }, timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

// the url we use here is the same as the one used to fetch google ads
// "mode: no-cors" is the magic that makes this work by causing the fetch to throw appropriately
// otherwise, the behaviour is inconsistent across different adblockers and browsers (e.g. enabled ublock origin won't throw when it should)
const isAdBlockEnabled = async (): Promise<boolean> => {
  try {
    await fetch(
      new Request(
        'https://cdn4.buysellads.net/pub/diffchecker.js?' +
          (new Date().getTime() - (new Date().getTime() % 600000)),
        { mode: 'no-cors' },
      ),
    );
  } catch {
    return true;
  }

  return false;
};

const rand50 = (): boolean => Math.random() < 0.5;

const defaultAdPositions: AdPositions = {
  aboveForm: { ads: [diffcheckerDesktopNativeAd, undefined] },
  aboveSubmit: {
    ads: [rand50() ? bibcitationNativeAd : launchUiNativeAd, svgviewerNativeAd],
  },
  heroRight: { ads: [diffcheckerDesktopNativeAd] },
};

interface AdCoordinatorProps {
  type: 'text' | 'rest' | 'redesign';
}

/**
 * Current ad ordering:
 * - topLeft: native, custom_diffchecker
 * - topRight: native, carbon, google
 * - bottomLeft: native, google
 * - bottomRight: native, google, custom_svgviewer
 *   - don't show google if bottomLeft is already google
 * - belowSubmit: google
 *   - only show if bottomLeft and bottomRight are both native
 */

export const AdCoordinatorProvider: React.FC<
  React.PropsWithChildren<AdCoordinatorProps>
> = (props) => {
  const left = useAppSelector((state) => getDiff(state).left);
  const right = useAppSelector((state) => getDiff(state).right);
  const isPro = useAppSelector(isProUser);
  const [positions, setPositions] = useState<AdPositions>({
    aboveForm: defaultAdPositions.aboveForm,
    aboveSubmit: { ads: [] },
    belowSubmit: { ads: [] },
  });

  const coordinateAds = useCallback(async () => {
    if (props.type !== 'text') {
      setPositions(defaultAdPositions);
      return;
    }

    const networkAds = await fetchNetworkAds(8000);
    if (!networkAds) {
      setPositions(defaultAdPositions);
      return;
    }

    const adBlockEnabled = await isAdBlockEnabled();
    const topLeftAd: NativeAd = networkAds.topLeft
      ? networkAds.topLeft
      : diffcheckerDesktopNativeAd;
    const shouldShowCarbonOnTopRight = Math.random() < 0.25 || adBlockEnabled;
    const topRightAd: NativeAd = networkAds.topRight
      ? networkAds.topRight
      : networkAds.carbon && shouldShowCarbonOnTopRight
        ? networkAds.carbon
        : { ...defaultGoogleAd, zoneId: AD_ZONE_IDS.googleCarbonFallback };

    const bottomLeftAd: NativeAd = networkAds.bottomLeft
      ? networkAds.bottomLeft
      : adBlockEnabled
        ? bibcitationNativeAd
        : { ...defaultGoogleAd, zoneId: AD_ZONE_IDS.googleLeaderboard };

    const bottomRightAd: NativeAd = networkAds.bottomRight
      ? networkAds.bottomRight
      : bottomLeftAd.platform !== 'google' && !adBlockEnabled
        ? { ...defaultGoogleAd, zoneId: AD_ZONE_IDS.googleLeaderboard }
        : rand50()
          ? svgviewerNativeAd
          : launchUiNativeAd;

    const belowSubmitAd: NativeAd | undefined =
      bottomLeftAd.platform === 'native' &&
      bottomRightAd.platform === 'native' &&
      !adBlockEnabled
        ? { ...defaultGoogleAd, zoneId: AD_ZONE_IDS.googleLeaderboard }
        : undefined;

    const sidebarAd: NativeAd | undefined =
      !shouldShowCarbonOnTopRight && networkAds.carbon
        ? networkAds.carbon
        : undefined;
    setPositions({
      aboveForm: {
        ads: [topLeftAd, topRightAd],
      },
      aboveSubmit: {
        ads: [bottomLeftAd, bottomRightAd],
      },
      belowSubmit: belowSubmitAd && {
        ads: [belowSubmitAd],
      },
      heroRight: {
        ads: [diffcheckerDesktopNativeAd],
      },
      sidebar: sidebarAd && {
        ads: [sidebarAd],
      },
    });
  }, [props.type]);

  useEffect(() => {
    if (isPro) {
      return;
    }

    coordinateAds().then(() => {
      // this guarantees that we can preemptively set ad commands even if optimize hasn't been inited yet
      // https://docs.buysellads.com/optimize/functions
      if (!window.optimize) {
        window.optimize = { queue: [] };
      }

      // refresh google ads (network ads refresh is handled in coordinateAds)
      window.optimize.queue.push(() => {
        window.optimize.pushAll(); // we prefer pushAll() here over refreshAll() since it behaves more consistently
      });
    });
  }, [left, right, isPro, coordinateAds]);
  return (
    <AdCoordinatorContext.Provider value={[positions, setPositions]}>
      {props.children}
    </AdCoordinatorContext.Provider>
  );
};
