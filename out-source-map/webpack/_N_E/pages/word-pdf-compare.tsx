import * as React from 'react';
import { AdCoordinatorProvider } from 'components/ad-coordinator';
import Hero from 'components/new/hero';
import Page from 'components/new/page';
import PdfDiffChecker from 'components/new/pdf-diff/pdf-diff-checker';
import { t } from 'lib/react-tiny-i18n';
import titleTemplate from 'lib/title-template';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import HomepageModal from 'components/new/homepage-modal';
import ElectronTitle from 'types/electron-page-titles';
import DocumentSvg from 'components/shared/icons/document.svg';
import css from './word-pdf-compare.module.css';
import { DiffInputType } from 'types/diff-input-type';
import { useUrlParams } from 'lib/state/urlParams';
import { useState } from 'react';
import { useRRWebRecording } from 'lib/hooks/use-rrweb-recording';

const PdfDiff = (): JSX.Element => {
  const [hideAds, setHideAds] = useState(false);
  const {
    leftPath: initialLeftPath,
    rightPath: initialRightPath,
    origin: diffOrigin,
  } = useUrlParams();
  const isPro = useAppSelector(isProUser);
  const recordingInfo = useRRWebRecording(DiffInputType.PDF);

  const pageProps = process.env.NEXT_PUBLIC_IS_ELECTRON
    ? {
        title: ElectronTitle.DocumentDiff,
      }
    : {
        title: titleTemplate(t('PdfDiff.Meta.title')),
        metaDescription: t('PdfDiff.Meta.description'),
        metaKeywords: t('PdfDiff.Meta.keywords'),
      };

  return (
    <Page name="PDF diff" fullWidth {...pageProps} miniFooter>
      <div className={css.pdfDiffContainer}>
        <AdCoordinatorProvider type="redesign">
          <div className={css.pdfDiffContent}>
            {!isPro && !hideAds && (
              <Hero
                svg={DocumentSvg}
                header={t('PdfHero.header')}
                description={[
                  t('PdfHero.description1'),
                  t('PdfHero.description2'),
                ]}
                diffInputType={DiffInputType.PDF}
                showAds
              />
            )}
            {!process.env.NEXT_PUBLIC_IS_ELECTRON && <HomepageModal />}
            <PdfDiffChecker
              initialLeftPath={initialLeftPath}
              initialRightPath={initialRightPath}
              hideAds={() => setHideAds(true)}
              recordingInfo={recordingInfo}
              diffOrigin={diffOrigin}
            />
          </div>
        </AdCoordinatorProvider>
      </div>
    </Page>
  );
};
export default PdfDiff;
