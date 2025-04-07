import DiffChecker from 'components/new/diff-checker';
import HomepageModal from 'components/new/homepage-modal';
import Page from 'components/new/page';
import diffRouter from 'lib/diff-router';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as DiffActions from 'redux/modules/diff-module';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector, wrapper } from 'redux/store';
import Error from 'next/error';
import { DiffInputType } from 'types/diff-input-type';
import { useUrlParams } from 'lib/state/urlParams';
import { type NetworkError } from 'types/network-error';
import { AdCoordinatorProvider } from 'components/ad-coordinator';
import { useRRWebRecording } from 'lib/hooks/use-rrweb-recording';
import ElectronTitle from 'types/electron-page-titles';
import { t } from 'lib/react-tiny-i18n';
import { captureException } from 'lib/sentry';
import { AccessErrorInfo } from 'components/file-access-error-modal';
import dynamic from 'next/dynamic';

const Homepage = ({ statusCode }: { statusCode: number }): JSX.Element => {
  const dispatch = useAppDispatch();
  const currDiff = useAppSelector(getDiff);
  const left = useAppSelector((state) => getDiff(state).left);
  const right = useAppSelector((state) => getDiff(state).right);
  const fullyNormalized = useAppSelector(
    (state) => getDiff(state).fullyNormalized,
  );
  const slug = useAppSelector((state) => getDiff(state).slug);
  const diffLength = useAppSelector((state) => state.diff.diffs.length);
  const router = useRouter();
  const urlParams = useUrlParams();
  const recordingInfo = useRRWebRecording(DiffInputType.TEXT);

  // these are only for error handling
  const [leftUploadedPath, setLeftUploadedPath] = useState<string>('');
  const [rightUploadedPath, setRightUploadedPath] = useState<string>('');

  const [leftAccessErrorInfo, setLeftAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);
  const [rightAccessErrorInfo, setRightAccessErrorInfo] =
    useState<AccessErrorInfo | null>(null);

  const [diffOrigin, setDiffOrigin] = useState<string>();

  useEffect(() => {
    const helperForUseEffect = async () => {
      // Handle electron specific logic
      const { leftPath, rightPath, origin: diffOrigin } = urlParams;
      setDiffOrigin(diffOrigin);
      const shouldDiffLocalFiles = !!leftPath || !!rightPath;

      if (process.env.NEXT_PUBLIC_IS_ELECTRON && shouldDiffLocalFiles) {
        const { fetchLocalFileAsText } = await import(
          'lib/fetch-local-file-as-text'
        );

        const safelyFetchLocalFileAsText = async (
          path: string,
          side: 'left' | 'right',
        ) => {
          const response = await fetchLocalFileAsText(path);

          const { FileAccessErrors } = await import('types/file-access-errors');

          if (side === 'left') {
            setLeftUploadedPath(path);

            if (!response.ok) {
              captureException(
                `could not fetch local file text file, error code: ${response.error.code}`,
              );

              setLeftAccessErrorInfo({
                type: FileAccessErrors.RECENT_DIFF,
                error: response.error,
              });

              return '';
            }
          } else {
            setRightUploadedPath(path);

            if (!response.ok) {
              captureException(
                `could not fetch local file text file, error code: ${response.error.code}`,
              );

              setRightAccessErrorInfo({
                type: FileAccessErrors.RECENT_DIFF,
                error: response.error,
              });

              return '';
            }
          }

          return response.text;
        };

        const [left, right] = await Promise.all([
          leftPath
            ? safelyFetchLocalFileAsText(leftPath, 'left')
            : Promise.resolve(''),
          rightPath
            ? safelyFetchLocalFileAsText(rightPath, 'right')
            : Promise.resolve(''),
        ]);
        dispatch(DiffActions.actions.createDiff({ left, right }));
        diffRouter.push(
          '/',
          '/text-compare/',
          'text-compare',
          diffLength,
          router.locale || 'en',
        );
        const { addRecentTextDiff } = await import(
          'components/new/recent-diffs/commands/recent-diff-utils'
        );
        addRecentTextDiff({
          left: { data: left },
          right: { data: right },
        });
        return;
      }

      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        const { openUrl } = urlParams;
        if (openUrl) {
          const res = await fetch(openUrl);
          const data = await res.json();
          dispatch(
            DiffActions.actions.createDiff({
              left: data.diff.left,
              right: data.diff.right,
            }),
          );
          diffRouter.push(
            '/',
            '/text-compare/',
            'text-compare',
            diffLength,
            router.locale || 'en',
          );
          Tracking.trackEvent('Opened file');
        }
      }

      // normalize current left + right text if necessary
      if (!fullyNormalized && left && right) {
        dispatch(DiffActions.actions.replaceDiff({ left, right }));
      } else if (!fullyNormalized) {
        dispatch(DiffActions.actions.updateDiff({ fullyNormalized: true }));
      }

      // replace curr history state if initial page load is on /slug route
      if (slug) {
        diffRouter.replace('/', `/${slug}/`, slug, 0, router.locale || 'en');
      }
    };
    void helperForUseEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  const isHome = !left && !right;
  return !!statusCode ? (
    <Error statusCode={statusCode} />
  ) : (
    <Page
      title={
        process.env.NEXT_PUBLIC_IS_ELECTRON
          ? ElectronTitle.TextDiff
          : t('Homepage.title')
      }
      name={isHome ? 'Home' : 'Diff'}
      fullWidth
      allowAds
    >
      {process.env.NEXT_PUBLIC_IS_ELECTRON ? (
        <>
          <DiffChecker
            diff={currDiff}
            scrollToOffset={58}
            setLeftAccessErrorInfo={setLeftAccessErrorInfo}
            setRightAccessErrorInfo={setRightAccessErrorInfo}
            setLeftUploadedPath={setLeftUploadedPath}
            setRightUploadedPath={setRightUploadedPath}
          />
          <FileAccessErrorModal
            leftAccessErrorInfo={leftAccessErrorInfo}
            setLeftAccessErrorInfo={setLeftAccessErrorInfo}
            rightAccessErrorInfo={rightAccessErrorInfo}
            setRightAccessErrorInfo={setRightAccessErrorInfo}
            leftFilePath={leftUploadedPath}
            rightFilePath={rightUploadedPath}
            diffInputType={DiffInputType.TEXT}
            diffOrigin={diffOrigin}
          />
        </>
      ) : (
        <div>
          <AdCoordinatorProvider type="text">
            {router.locale === 'en' && <HomepageModal />}
            <DiffChecker
              diff={currDiff}
              scrollToOffset={58}
              recordingInfo={recordingInfo}
            />
          </AdCoordinatorProvider>
        </div>
      )}
    </Page>
  );
};

Homepage.getInitialProps = wrapper.getInitialPageProps(
  (store) =>
    async ({ asPath, req, res, query }) => {
      if (!asPath) {
        return {};
      }

      if (asPath === '/' && typeof window !== 'undefined') {
        // homepage requested at base path (no slug)
        store.dispatch(DiffActions.actions.clearDiff());
        return {};
      }

      const diffStore = store.getState().diff;
      const storeSlug: string | undefined =
        diffStore.diffIndex === -1
          ? ''
          : diffStore.diffs[diffStore.diffIndex].slug;

      const slug = query.slug ? query.slug[0] : '';
      const sidebarTab = (query.slug && query.slug[1]) || 'settings';

      const isSavedDiffRoute = slug.match(/^\w{8}$/) && slug.length;
      const isTextCompareRoute = slug === 'text-compare';

      const slugMatchesStoreSlug = slug == storeSlug;

      if (isSavedDiffRoute || isTextCompareRoute) {
        if (
          sidebarTab === 'settings' ||
          sidebarTab === 'history' ||
          sidebarTab === 'comments'
        ) {
          store.dispatch(DiffActions.actions.setSidebarTab(sidebarTab));
        }
      }

      if (isSavedDiffRoute && !slugMatchesStoreSlug) {
        try {
          // if called on server we don't fully normalize; offload most computation to client
          const calledOnServer = !!req;
          const cookie = req?.headers.cookie;

          await store
            .dispatch(DiffActions.getDiff({ slug, calledOnServer, cookie }))
            .unwrap();
        } catch (e) {
          if (!res) {
            return;
          }
          if ((e as NetworkError).status === 401) {
            res.statusCode = 301;
            res.setHeader(
              'Location',
              `/login?next=${encodeURIComponent(`/${slug}`)}`,
            );
          } else {
            res.statusCode = 404;
          }
        }
      } else if (slug.length > 0 && slug !== 'index') {
        // index route is used by electron for opening diffs
        if (res) {
          res.statusCode = 404;
          return {
            statusCode: 404,
          };
        }
      }

      return {};
    },
);

const FileAccessErrorModal = dynamic(
  () => import('components/file-access-error-modal'),
  { ssr: false },
);

export default Homepage;
