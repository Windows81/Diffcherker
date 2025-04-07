import * as React from 'react';
import FeaturesPerformanceIcon from 'static/images/new/features-performance.svg';
import FeaturesExportIcon from 'static/images/new/features-export.svg';
import FeaturesAdsIcon from 'static/images/new/features-ads.svg';
import ImageRetina from 'components/imageRetina';
import page from 'pages/desktop.module.css';
import css from './features.module.css';
import cx from 'classnames';

const Features = (): JSX.Element => {
  return (
    <div className={css.features}>
      <div className={css.featuresRow}>
        <div className={cx(css.feature, css.featureWithPreview)}>
          <div className={css.featurePreview}>
            <ImageRetina
              format="webp"
              src="mockups/character-diff"
              alt="Diffchecker interface screenshot"
            />
          </div>
          <div className={css.featureCaption}>
            <h3 className={page.headingXs}>
              Character-by-character comparison
            </h3>
            <p className={page.paragraph}>
              When every detail matters, check your code, contracts or invoices
              down to each individual character
            </p>
          </div>
        </div>
        <div className={cx(css.feature, css.featureWithPreview)}>
          <div className={css.featurePreview}>
            <ImageRetina
              format="webp"
              src="mockups/syntax-highlighting"
              alt="Diffchecker interface screenshot"
            />
          </div>
          <div className={css.featureCaption}>
            <h3 className={page.headingXs}>Syntax highlighting</h3>
            <p className={page.paragraph}>
              Pick from more than 20+ languages, including Javascript, Markdown,
              Python, R, and C++
            </p>
          </div>
        </div>
      </div>
      <div className={css.featuresRow}>
        <div className={cx(css.feature, css.featureWithIcon)}>
          <div className={css.featureIcon}>
            <FeaturesPerformanceIcon />
          </div>
          <div className={css.featureCaption}>
            <h3 className={page.headingXs}>High-speed performance </h3>
            <p className={page.paragraph}>
              Compare a thousand lines of code or even the most complex PDFs in
              no time
            </p>
          </div>
        </div>
        <div className={cx(css.feature, css.featureWithIcon)}>
          <div className={css.featureIcon}>
            <FeaturesExportIcon />
          </div>
          <div className={css.featureCaption}>
            <h3 className={page.headingXs}>Export in multiple formats</h3>
            <p className={page.paragraph}>
              Download files in the Diffchecker format or export them as a PDF
              in one click
            </p>
          </div>
        </div>
        <div className={cx(css.feature, css.featureWithIcon)}>
          <div className={css.featureIcon}>
            <FeaturesAdsIcon />
          </div>
          <div className={css.featureCaption}>
            <h3 className={page.headingXs}>No ads</h3>
            <p className={page.paragraph}>
              Eliminate distractions so you can focus on what really matters —
              your work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
