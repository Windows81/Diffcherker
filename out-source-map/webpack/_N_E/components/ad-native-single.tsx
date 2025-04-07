import * as React from 'react';
import cx from 'classnames';
import { type NativeAd } from 'types/native-ad';
import decode from 'unescape';

import css from './ad-native-single.module.css';
import Badge from './shared/badge';

const extractPixelSourceTemplates = (pixel: string) => pixel.split('||');

const createBuildPixelSource =
  (timestamp: string) => (sourceTemplate: string) => {
    return sourceTemplate.replace('[timestamp]', timestamp);
  };

const buildPixelEl = (pixelSrc: string) => (
  <img
    src={pixelSrc}
    key={pixelSrc}
    alt="pixel source"
    width="0"
    height="0"
    style={{ display: 'none' }}
    role="presentation"
  />
);

interface NativeAdSingleProps {
  ad: NativeAd;
  position: string;
  onClick: () => void;
  hasSiblingGoogleAd: boolean;
}

const NativeAdSingle: React.FC<NativeAdSingleProps> = ({
  ad,
  position,
  onClick,
  hasSiblingGoogleAd,
}) => {
  return (
    <div
      className={cx(css.adNative, {
        [css.hasSiblingGoogleAd]: hasSiblingGoogleAd,
        [css.fullWidth]:
          position.startsWith('above') || position.startsWith('hero'),
      })}
    >
      {/* eslint-disable-next-line react/jsx-no-target-blank */}
      <a
        onClick={onClick}
        href={ad.statlink}
        target="_blank"
        className={cx(css.banner, {
          [css.allowBreak]: position.startsWith('above'),
          [css.transparentImage]: ad.backgroundColor === 'transparent',
        })}
        rel={ad.disableNofollow ? undefined : 'nofollow noopener'}
        style={
          {
            '--ctaBackgroundColor': ad.ctaBackgroundColor,
            '--ctaBackgroundHoverColor': ad.ctaBackgroundHoverColor,
            '--ctaTextColor': ad.ctaTextColor,
            '--ctaTextColorHover': ad.ctaTextColorHover,
            '--backgroundColor': ad.backgroundColor,
          } as React.CSSProperties
        }
      >
        <span className={css.innerContent}>
          <span className={css.imageAndText}>
            <img src={ad.image} alt={`${ad.company} icon`} />
            <div className={css.textAndButton}>
              <span className={css.text}>
                <span className={css.title}>
                  {!ad.ourAd && (
                    <Badge style="secondary" tone="base">
                      ad
                    </Badge>
                  )}
                  {position === 'aboveForm' && ad.description
                    ? ad.company
                    : ad.companyTagline}{' '}
                </span>
                <span className={css.description}>
                  {decode(ad.description)}
                </span>
              </span>
              <span
                className={cx(css.cta, {
                  [css.hide]: position.startsWith('hero'),
                })}
              >
                {ad.callToAction}
              </span>
            </div>
          </span>
        </span>
        {!!ad.pixel &&
          !!ad.timestamp &&
          extractPixelSourceTemplates(ad.pixel)
            .map(createBuildPixelSource(String(ad.timestamp)))
            .map(buildPixelEl)}
      </a>
    </div>
  );
};

export default NativeAdSingle;
