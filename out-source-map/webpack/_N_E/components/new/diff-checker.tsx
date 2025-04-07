import cx from 'classnames';
import AdDisplay from 'components/ad-display';
import MessageBanner from 'components/shared/message-banner';
import getDiffTitle from 'lib/get-diff-title';
import usePrevious from 'lib/hooks/use-previous';
import titleTemplate from 'lib/title-template';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as DiffActions from 'redux/modules/diff-module';
import * as UserActions from 'redux/modules/user-module';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { DiffPermission, type Diff } from 'types/diff';
import { DiffInputType } from 'types/diff-input-type';

import diffRouter from 'lib/diff-router';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import * as DiffAction from 'redux/modules/diff-module';
import { getCommentThreads } from 'redux/selectors/comment-threads-selector';
import { CommentLocation } from 'types/comment';
import css from './diff-checker.module.css';
import DownloadDesktopModal from './download-desktop-modal';
import SaveDiffModal from './save-diff-modal';
import SavedDiffSidebar from './saved-diff-sidebar';
import ShareDiffModal from './share-diff-modal';
import TextDiffForm from './text-diff-form';
import TextDiffHeader from './text-diff-header';
import TextDiffOutput from './text-diff-output';
import { TextDiffOutputApi } from './text-diff-output/context';
import TextDiffSidebar from './text-diff-sidebar';
import { DiffSide } from 'types/diffSide';
import DesktopModal from './desktop-modal/desktop-modal';
import yn from 'yn';
import { RecordingInfo } from 'types/recordingInfo';
import { AccessErrorInfo } from 'components/file-access-error-modal';
const AuthModal = dynamic(async () => await import('components/auth/modal'), {
  ssr: false,
});

const CommentModalsNameCapture = dynamic(
  async () => await import('components/comment/modals/name-capture'),
  {
    ssr: false,
  },
);
const AD_MIN_HEIGHT = 100;

interface DiffCheckerProps {
  diff: Diff;
  scrollToOffset?: number;
  recordingInfo?: RecordingInfo;
  setLeftAccessErrorInfo?: (
    leftAccessErrorInfo: AccessErrorInfo | null,
  ) => void;
  setRightAccessErrorInfo?: (
    rightAccessErrorInfo: AccessErrorInfo | null,
  ) => void;
  setLeftUploadedPath?: (leftUploadedPath: string) => void;
  setRightUploadedPath?: (rightUploadedPath: string) => void;
}

const Diffchecker: React.FC<DiffCheckerProps> = ({
  diff,
  scrollToOffset,
  recordingInfo,
  setLeftAccessErrorInfo,
  setRightAccessErrorInfo,
  setLeftUploadedPath,
  setRightUploadedPath,
}) => {
  const { title, slug } = diff;
  const oldPropsSlug = usePrevious(diff.slug);
  const settings = useAppSelector((state) => state.diff.textDiffOutputSettings);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showSignedUpModal, setShowSignedUpModal] = useState(false);
  const [topHeight, setTopHeight] = useState(AD_MIN_HEIGHT);
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);

  const diffHistoryCount = useAppSelector((state) => state.diff.diffs.length);
  const dispatch = useAppDispatch();
  const isLiveDiff = settings.diffVersion === 'live';
  const errorCode = useAppSelector((state) => state.diff.errorCode);
  const isPro = useAppSelector(isProUser);
  const oldUser = usePrevious(user);
  const [triedOpeningShareModal, setTriedOpeningShareModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const textDiffOutputApi = useRef<TextDiffOutputApi>(null);
  const commentThreads = useAppSelector(getCommentThreads);
  const [desktopModal, setDesktopModal] = useState<boolean>(false);
  const [showNameCapturingModal, setShowNameCapturingModal] =
    useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [triedToCommentOn, setTriedToCommentOn] = useState<
    CommentLocation | undefined
  >();

  const isHome = useMemo(() => !diff.left && !diff.right, [diff]);
  const pageTitle = getDiffTitle({ title, slug });
  const commentThreadsLoadedForSlug = useAppSelector(
    (state) => state.diff.commentThreadsLoadedForSlug,
  );

  const allowComments = !diff.slug || diff.permission == DiffPermission.COMMENT;

  const openShareModal = () => {
    Tracking.trackEvent('Clicked diff button', { diffButton: 'share' });
    if (slug) {
      setIsShareModalOpen(true);
    } else {
      setIsSaveModalOpen(true);
      setTriedOpeningShareModal(true);
    }
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  const openSaveModal = () => {
    Tracking.trackEvent('Clicked diff button', { diffButton: 'save' });
    setIsSaveModalOpen(true);
  };

  const openSaveModalForComment = () => {
    Tracking.trackEvent('Tried adding comment on an unsaved diff');
    setIsSaveModalOpen(true);
  };

  const openSaveModalToDuplicate = () => {
    Tracking.trackEvent('Clicked diff button', { diffButton: 'duplicate' });
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = (saved?: boolean) => {
    setIsSaveModalOpen(false);
    if (triedOpeningShareModal) {
      setTriedOpeningShareModal(false);
    }

    // If saved open the share modal.
    // If trying to comment, skip the share modal step.
    if (saved && !triedToCommentOn) {
      setIsShareModalOpen(true);
    } else if (!saved) {
      setTriedToCommentOn(undefined);
    }
  };

  const handleHeightChange = useCallback(
    (height: number) => setTopHeight(height),
    [],
  );

  /**
   * Get All the diffs for a given user
   */
  const getDiffs = useCallback(async () => {
    if (user?.id) {
      dispatch(UserActions.getDiffs({ id: user.id }));
    }
  }, [user, dispatch]);

  /**
   * Resets the error state and selection state when the diff changes.
   * TODO: See if this is actually still needed... I suspect it isn't.
   */
  useEffect(() => {
    // did update
    if (diff.slug !== oldPropsSlug) {
      dispatch(DiffActions.actions.clearErrors());
    }

    if (!diff.added && !diff.removed) {
      // scroll to the top after a merge causes the files to be identical
      window.scrollTo(0, 0);
      textDiffOutputApi.current?.endSelection();
    }

    if (!oldUser && user) {
      // initial load has no user at first then logs the user in TODO: make this cleaner
      void getDiffs();
    }
  }, [
    diff.added,
    diff.removed,
    diff.slug,
    dispatch,
    getDiffs,
    oldPropsSlug,
    oldUser,
    user,
  ]);

  /**
   * Custom browser nav handling for this component
   */
  useEffect(() => {
    const handleBrowserNavigation = (e: PopStateEvent): void => {
      const diffIndex = e.state?.options?.index;
      const asPath = e.state?.as;

      if (asPath === '/') {
        dispatch(DiffActions.actions.chooseDiff(-1));
        return;
      }

      if (typeof diffIndex !== 'undefined') {
        dispatch(DiffActions.actions.chooseDiff(diffIndex));
      }
    };
    window.addEventListener('popstate', handleBrowserNavigation, false);

    if (router.query.pro === 'true') {
      setShowTrialModal(true);
      void router.replace('/', '/', { shallow: true });
    } else if (router.query.signedup === 'true') {
      setShowSignedUpModal(true);
      void router.replace('/', '/', { shallow: true });
    }

    return () => {
      dispatch(DiffActions.actions.clearErrors());
      window.removeEventListener('popstate', handleBrowserNavigation, false);
    };
  }, [router, dispatch]);

  useEffect(() => void getDiffs(), [getDiffs]);

  /**
   * Load the commentThreads when they are not loaded for the given
   * saved Diff
   */
  useEffect(() => {
    if (diff.slug && commentThreadsLoadedForSlug !== diff.slug) {
      dispatch(DiffActions.getCommentThreads({ slug: diff.slug }));
    }
  }, [commentThreadsLoadedForSlug, diff.slug, dispatch]);

  /**
   * A method to verify the ability to comment.
   *
   * Checks for whether the diff:
   * 1. Saved
   * 2. The user is logged in
   * 3. The user has a name
   *
   * This verify function also memorizes what comment location the user attempted to open
   * and forgets as soon as this check passes, as a convenience for the user.
   */
  const verifyCommentAbility = useCallback(
    (location?: CommentLocation | DiffSide) => {
      const isASide = location === 'left' || location === 'right';
      if (!isASide) {
        setTriedToCommentOn(location);
      }

      if (!slug) {
        openSaveModalForComment();
        return false;
      }

      if (!user) {
        setShowAuthModal(true);
        return false;
      }

      if (user && !user.name) {
        setShowNameCapturingModal(true);
        return false;
      }

      const canViewComment = diff.permission == DiffPermission.COMMENT;

      if (canViewComment) {
        setTriedToCommentOn(undefined);
        return true;
      }

      return false;
    },
    [diff.permission, slug, user],
  );

  /**
   * If something changes that might suddenly allow the user
   * to begin commenting where they tried to comment on a line
   * before, do them a favour and open the comment for them if
   * we can.
   */
  useEffect(() => {
    if (triedToCommentOn) {
      setTimeout(() => {
        if (
          verifyCommentAbility(triedToCommentOn) &&
          textDiffOutputApi.current
        ) {
          const api = textDiffOutputApi.current;
          api.openComment(triedToCommentOn);
        }
      }, 10);
    }
  }, [user, slug, diff.permission, triedToCommentOn, verifyCommentAbility]);

  /**
   * Handler for when a diff changes.
   * Add it the diff history stack!
   */
  const onDiffChange = useCallback(
    async (newDiff: Diff) => {
      dispatch(
        // Take new diff, and remove
        DiffActions.actions.addDiff({
          ...newDiff,
          slug: undefined,
        }),
      );
      diffRouter.push(
        '/',
        '/text-compare/',
        'text-compare',
        diffHistoryCount,
        router.locale || 'en',
      );
    },
    [diffHistoryCount, dispatch, router.locale],
  );

  return (
    <div className={css.diffCheckerContainer}>
      {isHome && (
        <noscript className={css.diffCheckerNoscript}>
          Your browser does not support JavaScript!
          <br />
          <br />
          Try our alternate site:{' '}
          {/* eslint-disable-next-line react/jsx-no-target-blank */}
          <a
            href="https://www.comparetext.net"
            target="_blank"
            style={{ color: 'var(--color-green-500)' }}
          >
            Compare Text
          </a>
        </noscript>
      )}

      <DownloadDesktopModal
        isOpen={showTrialModal || showSignedUpModal}
        closeModal={() => {
          if (showTrialModal) {
            setShowTrialModal(false);
          }
          if (showSignedUpModal) {
            setShowSignedUpModal(false);
          }
        }}
        type={showTrialModal ? 'trial' : 'signed up'}
      />

      {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <>
          <SaveDiffModal
            isOpen={isSaveModalOpen}
            closeModal={closeSaveModal}
            triedOpeningShareModal={triedOpeningShareModal}
            defaultPermission={
              triedToCommentOn ? DiffPermission.COMMENT : DiffPermission.VIEW
            }
            titleOverride={
              triedToCommentOn ? 'Save before adding comments' : undefined
            }
            explinationOverride={
              triedToCommentOn
                ? 'You need to save your diff before adding any comments. Saved diffs can be accessed later and shared with others.'
                : undefined
            }
          />
          <ShareDiffModal
            isOpen={isShareModalOpen}
            closeModal={closeShareModal}
          />
        </>
      )}
      {!isHome && !process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <Head>
          <title>{titleTemplate(pageTitle)}</title>
          <meta
            key="ogTitle"
            property="og:title"
            content={titleTemplate(pageTitle)}
          />
          {title && title !== 'Untitled diff' ? (
            <>
              <meta
                key="description"
                name="description"
                content={`${title} - ${diff.left?.substring(0, 100)}`}
              />
              <meta
                key="ogDescription"
                property="og:description"
                content={`${title} - ${diff.left?.substring(0, 100)}`}
              />
            </>
          ) : (
            <>
              <meta
                key="description"
                name="description"
                content={diff.left?.substring(0, 100)}
              />
              <meta
                key="ogDescription"
                property="og:description"
                content={diff.left?.substring(0, 100)}
              />
            </>
          )}
        </Head>
      )}
      <div className={css.diffChecker} data-testid="diff-checker">
        <div className={css.diffCheckerEditor} key="diff-checker-editor">
          {(process.env.NEXT_PUBLIC_IS_ELECTRON || !isHome) && (
            <div
              className={cx(css.diffOutputContainer, { [css.notPro]: !isPro })}
            >
              <TextDiffSidebar
                isHome={isHome}
                settings={settings}
                apiRef={textDiffOutputApi}
                onSettingsChange={(newSettings) => {
                  dispatch(DiffAction.actions.applySettings(newSettings));
                }}
                aboveSidebar={
                  !isPro && <TopSectionDescription height={topHeight} />
                }
              />
              <div className={css.entireOutput}>
                {!isPro && (
                  <TopSectionAds handleHeightChange={handleHeightChange} />
                )}
                {!isHome && (
                  <div className={css.output}>
                    <TextDiffHeader
                      title={title}
                      slug={slug}
                      createdAt={diff.createdAt}
                      expires={diff.expires}
                      openShareModal={openShareModal}
                      openSaveModalToDuplicate={openSaveModalToDuplicate}
                      openSaveModal={openSaveModal}
                    />

                    {!isHome &&
                      !isLiveDiff &&
                      typeof diff.left !== 'undefined' &&
                      diff.left === diff.right && (
                        <div className={css.identicalDiff}>
                          <MessageBanner
                            type="info"
                            title="The two files are identical"
                            message="There is no difference to show between these two files"
                          />
                        </div>
                      )}

                    <div
                      className={cx(css.outputSection, {
                        [css.liveDiffOutputSection]: isLiveDiff,
                      })}
                    >
                      <TextDiffOutput
                        apiRef={textDiffOutputApi}
                        diff={diff}
                        settings={settings}
                        commentThreads={commentThreads}
                        showTopBar={true}
                        showLocationBar={true}
                        showSwapSides={true}
                        allowComments={
                          process.env.NEXT_PUBLIC_IS_ELECTRON
                            ? false
                            : allowComments
                        }
                        allowMerging={true}
                        allowCodeMoves={true}
                        scrollToOffset={scrollToOffset}
                        willOpenComment={verifyCommentAbility}
                        willOpenAllComments={verifyCommentAbility}
                        onChange={onDiffChange}
                        noVirtuoso={yn(
                          process.env.NEXT_PUBLIC_TEST_ENVIRONMENT,
                        )}
                      />
                    </div>
                  </div>
                )}
                {process.env.NEXT_PUBLIC_IS_ELECTRON &&
                  (isHome || !isLiveDiff) && (
                    <div className="hide-print">
                      <TextDiffForm
                        isHome={isHome}
                        isPro={isPro}
                        resetSelectionIndex={() =>
                          textDiffOutputApi.current?.endSelection()
                        }
                        left={diff.left}
                        right={diff.right}
                        setLeftAccessErrorInfo={setLeftAccessErrorInfo}
                        setRightAccessErrorInfo={setRightAccessErrorInfo}
                        setLeftUploadedPath={setLeftUploadedPath}
                        setRightUploadedPath={setRightUploadedPath}
                      />
                    </div>
                  )}
              </div>
            </div>
          )}

          {!process.env.NEXT_PUBLIC_IS_ELECTRON && (isHome || !isLiveDiff) && (
            <div className={cx('hide-print', css.diffInputContainer)}>
              <SavedDiffSidebar
                aboveSidebar={
                  !isPro &&
                  isHome && <TopSectionDescription height={topHeight} />
                }
                isHome={isHome}
              />
              <div className={css.diffInput}>
                {/* TODO error message display component */}
                {!isPro && isHome && (
                  <TopSectionAds handleHeightChange={handleHeightChange} />
                )}
                {!!errorCode && (
                  <MessageBanner
                    type="error"
                    title="Diff does not exist"
                    message={
                      'This diff may have expired or been deleted\nIf you need help, you can contact us at admin@diffchecker.com'
                    }
                  />
                )}
                <TextDiffForm
                  isHome={isHome}
                  isPro={isPro}
                  resetSelectionIndex={() =>
                    textDiffOutputApi.current?.endSelection()
                  }
                  left={diff.left}
                  right={diff.right}
                  recordingInfo={recordingInfo}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {!isPro && (
        <DesktopModal
          isOpen={desktopModal}
          closeModal={() => setDesktopModal(false)}
        />
      )}
      {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <AuthModal
          isOpen={showAuthModal}
          onAuthenticated={() => {
            setShowAuthModal(false);
          }}
          closeModal={() => {
            setTriedToCommentOn(undefined);
            setShowAuthModal(false);
          }}
        />
      )}
      {!process.env.NEXT_PUBLIC_IS_ELECTRON && user && (
        <CommentModalsNameCapture
          isOpen={showNameCapturingModal}
          user={user}
          onNameCaptured={() => {
            setShowNameCapturingModal(false);
          }}
          closeModal={() => {
            setTriedToCommentOn(undefined);
            setShowNameCapturingModal(false);
          }}
        />
      )}
    </div>
  );
};

interface TopSectionDescriptionProps {
  height: number;
}

const TopSectionDescription: React.FC<TopSectionDescriptionProps> = ({
  height,
}) => {
  return (
    <div className={css.overflowWrapper} style={{ height }}>
      <div className={css.description}>
        <h1 className={css.descriptionTitle}>{t('Hero.title')}</h1>
        <p className={css.descriptionTagline}>{t('Hero.description')}</p>
      </div>
    </div>
  );
};

interface TopSectionAdsProps {
  handleHeightChange: (height: number) => void;
}

const TopSectionAds: React.FC<TopSectionAdsProps> = ({
  handleHeightChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number>(0);

  useEffect(() => {
    const element = ref?.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (element.clientHeight === prevHeight.current) {
        return;
      }

      const newHeight = Math.max(element.clientHeight, AD_MIN_HEIGHT);
      handleHeightChange(newHeight);
      prevHeight.current = newHeight;
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [handleHeightChange]);

  return (
    <div className={css.ads} ref={ref}>
      <AdDisplay diffInputType={DiffInputType.TEXT} position="aboveForm" />
    </div>
  );
};

export default Diffchecker;
