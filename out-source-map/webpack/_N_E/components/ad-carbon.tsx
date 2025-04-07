import css from './ad-carbon.module.css';
import cx from 'classnames';
import { NativeAd } from 'types/native-ad';

interface CarbonAdProps {
  position: string;
  ad: NativeAd;
  onClick: (position: string) => void;
}
const CarbonAd = ({ ad, position, onClick }: CarbonAdProps): JSX.Element => {
  const handleCarbonLinkClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    window.open(ad.ad_via_link, '_blank', 'noopener,noreferrer');
  };
  return (
    <a
      className={cx(css.container, css[`${position}Container`])}
      href={ad.statlink}
      target="_blank"
      rel={ad.disableNofollow ? 'noreferrer' : 'nofollow noopener noreferrer'}
      onClick={() => onClick(position)}
    >
      <img
        className={css.carbonImage}
        src={ad.smallImage}
        alt={`${ad.company} icon`}
      />

      <div>
        <p className={css.description}>{ad.description}</p>

        <span
          // have to use <span> here instead of <a> since browser complains about nested <a> tags
          className={css.carbonLink}
          onClick={handleCarbonLinkClick}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCarbonLinkClick(e);
            }
          }}
        >
          ads via Carbon
        </span>
      </div>
      {!!ad.pixel &&
        !!ad.timestamp &&
        extractPixelSourceTemplates(ad.pixel)
          .map(createBuildPixelSource(String(ad.timestamp)))
          .map(buildPixelEl)}
    </a>
  );
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

const extractPixelSourceTemplates = (pixel: string) => pixel.split('||');

const createBuildPixelSource =
  (timestamp: string) => (sourceTemplate: string) => {
    return sourceTemplate.replace('[timestamp]', timestamp);
  };

export default CarbonAd;
