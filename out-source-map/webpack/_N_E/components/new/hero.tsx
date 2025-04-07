import * as React from 'react';

import css from './hero.module.css';
import { DiffInputType } from 'types/diff-input-type';
import Icon from 'components/shared/icon';
import AdBox from 'components/ad-box';
import { diffcheckerDesktopNativeAd } from 'lib/custom-ads';

interface HeroProps {
  diffInputType: DiffInputType;
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  header: string;
  description: string | string[];
  showAds?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  diffInputType,
  svg,
  header,
  description,
  showAds,
}) => {
  return (
    <div className={css.hero}>
      <div className={css.mainContainer}>
        <div className={css.main}>
          <Icon size="large" svg={svg} />
          <div className={css.mainContent}>
            <h1>{header}</h1>
            {typeof description === 'string' ? (
              <p>{description}</p>
            ) : (
              description.map((line, i) => <p key={i}>{line}</p>)
            )}
          </div>
        </div>
      </div>
      {showAds && (
        <div className={css.adWrapBlock}>
          <div className={css.ads}>
            <AdBox
              diffInputType={diffInputType}
              position="heroRight"
              ads={[diffcheckerDesktopNativeAd]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default Hero;
