import { AdCoordinatorProvider } from 'components/ad-coordinator';
import ImageDiffChecker from 'components/image-diff-checker';
import Hero from 'components/new/hero';
import Page from 'components/new/page';
import ImageSvg from 'components/shared/icons/image.svg';
import { t } from 'lib/react-tiny-i18n';
import titleTemplate from 'lib/title-template';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import HomepageModal from 'components/new/homepage-modal';
import { DiffInputType } from 'types/diff-input-type';
import ElectronTitle from 'types/electron-page-titles';
import css from './image-compare.module.css';
import { useUrlParams } from 'lib/state/urlParams';
import { useRRWebRecording } from 'lib/hooks/use-rrweb-recording';

const ImageDiff = (): JSX.Element => {
  const {
    leftPath: initialLeftPath,
    rightPath: initialRightPath,
    origin: diffOrigin,
  } = useUrlParams();
  const isPro = useAppSelector(isProUser);
  const recordingInfo = useRRWebRecording(DiffInputType.IMAGE);

  const pageProps = process.env.NEXT_PUBLIC_IS_ELECTRON
    ? {
        title: ElectronTitle.ImageDiff,
      }
    : {
        title: titleTemplate(t('ImageDiff.Meta.title')),
        metaDescription: t('ImageDiff.Meta.description'),
        metaKeywords: t('ImageDiff.Meta.keywords'),
      };

  return (
    <Page name="Image diff" fullWidth {...pageProps}>
      <div className={css.imageDiffContainer}>
        <AdCoordinatorProvider type="redesign">
          {!isPro && (
            <Hero
              svg={ImageSvg}
              header={t('ImageHero.header')}
              description={[
                t('ImageHero.description1'),
                t('ImageHero.description2'),
              ]}
              diffInputType={DiffInputType.IMAGE}
              showAds
            />
          )}
          {!process.env.NEXT_PUBLIC_IS_ELECTRON && <HomepageModal />}
          <ImageDiffChecker
            initialLeftPath={initialLeftPath}
            initialRightPath={initialRightPath}
            recordingInfo={recordingInfo}
            diffOrigin={diffOrigin}
          />
        </AdCoordinatorProvider>
      </div>
    </Page>
  );
};

export default ImageDiff;
