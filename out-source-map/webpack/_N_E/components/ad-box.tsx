import * as React from 'react';
import cx from 'classnames';
import NativeAdSingle from 'components/ad-native-single';
import CarbonAd from './ad-carbon';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { type NativeAd as NativeAdType } from 'types/native-ad';

import css from './ad-box.module.css';
import { GoogleAd } from './ad-google';

interface AdBoxProps {
  position: string;
  diffInputType: string;
  ads: (NativeAdType | undefined)[];
}

const AdBox: React.FC<AdBoxProps> = React.memo((props: AdBoxProps) => {
  const router = useRouter();

  const handleCarbonAdClick = (position: string) => {
    Tracking.trackEvent('Clicked ad', {
      type: 'carbon',
      position,
    });
  };

  const handleNativeAdClick = (index: number, company: string): void => {
    Tracking.trackEvent('Clicked ad', {
      nativeAd: true,
      type: 'bsa',
      pathname: router.asPath,
      index,
      company,
      position: props.position,
    });
  };

  return (
    <div
      className={cx('hide-print', css.container, {
        [css.multipleAds]: props.ads.length !== 1,
        [css.belowSubmit]: props.position === 'belowSubmit',
      })}
    >
      {props.ads.map((ad, idx) => {
        if (!ad) {
          return (
            <div key={idx} className={css.emptyAd} style={{ width: '100%' }} />
          );
        }

        if (ad.platform === 'google' && ad.zoneId) {
          return <GoogleAd key={idx} adZoneId={ad.zoneId} />;
        }

        if (ad.platform === 'carbon') {
          return (
            <CarbonAd
              key={idx}
              ad={ad}
              position={props.position}
              onClick={handleCarbonAdClick}
            />
          );
        }

        if (ad.platform === 'native' || ad.platform === 'custom') {
          // this condition assumes
          // - there are only ever 2 ads in a given section
          // - google ads will only have native/custom siblings
          // if these assumptions change then this logic will also have to change
          const hasSiblingGoogleAd = props.ads.some(
            (ad) => ad?.platform === 'google',
          );

          return (
            <NativeAdSingle
              key={idx}
              ad={ad}
              position={props.position}
              hasSiblingGoogleAd={hasSiblingGoogleAd}
              onClick={() => handleNativeAdClick(idx, ad.company || '')}
            />
          );
        }
      })}
    </div>
  );
});

AdBox.displayName = 'AdBlock';

export default AdBox;
