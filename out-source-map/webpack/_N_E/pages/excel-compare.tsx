import { AdCoordinatorProvider } from 'components/ad-coordinator';
import ExcelDiffChecker from 'components/excel-diff-checker';
import Hero from 'components/new/hero';
import Page from 'components/new/page';
import { t } from 'lib/react-tiny-i18n';
import titleTemplate from 'lib/title-template';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import HomepageModal from 'components/new/homepage-modal';
import { DiffInputType } from 'types/diff-input-type';
import css from './excel-compare.module.css';
import Spreadsheet from './../components/shared/icons/spreadsheet.svg';
import ElectronTitle from 'types/electron-page-titles';
import cx from 'classnames';
import { useUrlParams } from 'lib/state/urlParams';
import { useRRWebRecording } from 'lib/hooks/use-rrweb-recording';
import { ExcelDiffOutputTypes } from 'lib/output-types';
import { useState } from 'react';

const ExcelDiff = (): JSX.Element => {
  const {
    leftPath: initialLeftPath,
    rightPath: initialRightPath,
    origin: diffOrigin,
  } = useUrlParams();
  const isPro = useAppSelector(isProUser);
  const recordingInfo = useRRWebRecording(DiffInputType.EXCEL);
  const [outputType, setOutputType] = useState<ExcelDiffOutputTypes>(
    ExcelDiffOutputTypes.Table,
  );

  const pageProps = process.env.NEXT_PUBLIC_IS_ELECTRON
    ? {
        title: ElectronTitle.ExcelDiff,
      }
    : {
        title: titleTemplate(t('ExcelDiff.Meta.title')),
        metaDescription: t('ExcelDiff.Meta.description'),
        metaKeywords: t('ExcelDiff.Meta.keywords'),
      };

  return (
    <Page name="Excel diff" fullWidth {...pageProps}>
      <div
        className={cx(css.excelContainer, {
          [css.isElectron]: process.env.NEXT_PUBLIC_IS_ELECTRON,
        })}
      >
        <AdCoordinatorProvider type="redesign">
          <div className={css.excelContent}>
            {!isPro && (
              <Hero
                diffInputType={DiffInputType.EXCEL}
                svg={Spreadsheet}
                header={t('ExcelHero.header')}
                description={[
                  t('ExcelHero.description1'),
                  t('ExcelHero.description2') +
                    'xls/xlsx/xlsm/xlsb, csv, txt, dif, ods.',
                ]}
                showAds
              ></Hero>
            )}
            {!process.env.NEXT_PUBLIC_IS_ELECTRON && <HomepageModal />}
            <ExcelDiffChecker
              initialLeftPath={initialLeftPath}
              initialRightPath={initialRightPath}
              recordingInfo={recordingInfo}
              outputType={outputType}
              setOutputType={setOutputType}
              diffOrigin={diffOrigin}
            />
          </div>
        </AdCoordinatorProvider>
      </div>
    </Page>
  );
};
export default ExcelDiff;
