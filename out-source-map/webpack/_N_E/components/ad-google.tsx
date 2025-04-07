import css from './ad-google.module.css';

// google ads are automatically injected here via the buysellads script in <head>
export const GoogleAd: React.FC<{ adZoneId: string }> = ({ adZoneId }) => {
  return (
    <div className={css.container}>
      <div id={adZoneId}></div>
    </div>
  );
};
