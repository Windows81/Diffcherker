import * as DiffActions from 'redux/modules/diff-module';
import * as UserActions from 'redux/modules/user-module';
import diffRouter from 'lib/diff-router';
import getDiffTitle from 'lib/get-diff-title';
import { getItem, setItem } from 'lib/local-storage';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { type SavedDiff as SavedDiffType } from 'redux/modules/diff-module';
import { getDiffs, getUserDiffs } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { type AnonDiff as AnonDiffType } from 'types/anonDiff';
import { DiffInputType } from 'types/diff-input-type';

import css from './saved-diffs.module.css';
import SidebarDiffItem from './sidebar-diff-item';
import { intlFormat } from 'date-fns';
import { t } from 'lib/react-tiny-i18n';

const SavedDiffs: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const diffs = useAppSelector(getDiffs);
  const savedDiffs = useAppSelector(getUserDiffs);
  const secretDiffs = useAppSelector((state) => state.user.secretDiffs);

  const displayedDiffs = [...savedDiffs, ...secretDiffs] as Array<
    SavedDiffType & Partial<AnonDiffType>
  >;

  // delete all expired diffs from user's local storage
  useEffect(() => {
    const loadAnonDiffs = async () => {
      const secretKeys: AnonDiffType[] = JSON.parse(
        getItem('secretKeys') || '[]',
      );
      const stillValidKeys: AnonDiffType[] = [];
      for (let i = 0; i < secretKeys.length; i++) {
        const expiresAt = secretKeys[i].expires;
        if (
          !expiresAt ||
          new Date(expiresAt).getTime() >= new Date().getTime()
        ) {
          stillValidKeys.push(secretKeys[i]);
        }
      }
      dispatch(UserActions.actions.setSecretDiffs(stillValidKeys));
      setItem('secretKeys', JSON.stringify(stillValidKeys));
    };
    void loadAnonDiffs();
    const eventListenerLoadAnonDiffs = () => {
      void loadAnonDiffs();
    };
    window.addEventListener('loadAnonDiffs', eventListenerLoadAnonDiffs);

    return () => {
      window.removeEventListener('loadAnonDiffs', eventListenerLoadAnonDiffs);
    };
  }, [dispatch]);

  const handleChooseDiff = useCallback(
    (slug: string, secretKey?: string) => {
      const newDiffIndex = diffs.length;
      Tracking.trackEvent('Clicked diff in sidebar', {
        diffInputType: DiffInputType.TEXT,
        type: 'saved',
      });
      dispatch(DiffActions.getDiff({ slug, secretKey, calledOnServer: false }));
      diffRouter.push(
        '/',
        `/${slug}/`,
        slug,
        newDiffIndex,
        router.locale || 'en',
      );
    },
    [diffs.length, dispatch, router.locale],
  );

  return (
    <div
      className={css.content}
      key={displayedDiffs.length}
      data-testid="saved-diffs"
    >
      {displayedDiffs.length === 0 && (
        <span className={css.noDiffs}>
          {t('SidebarSavedDiffs.haventSavedDiffs')}
        </span>
      )}
      {displayedDiffs.map(({ slug, secretKey, title, createdAt }) => (
        <SavedDiff
          key={slug}
          slug={slug}
          title={title}
          timestamp={createdAt}
          isSelected={window.location.pathname.endsWith(`/${slug}/`)}
          onClick={() => handleChooseDiff(slug, secretKey)}
        />
      ))}
    </div>
  );
};

interface SavedDiffProps {
  slug: string;
  title?: string;
  timestamp?: string;
  isSelected: boolean;
  onClick: () => void;
}

const SavedDiff: React.FC<SavedDiffProps> = ({
  slug,
  title,
  timestamp,
  isSelected,
  onClick,
}) => {
  return (
    <SidebarDiffItem
      onClick={onClick}
      isSelected={isSelected}
      classNames={{ selected: css.selected }}
    >
      <span className={css.savedDiff}>
        <span className={css.title}>{getDiffTitle({ title, slug })}</span>
        {timestamp && (
          <span className={css.timestamp}>
            {intlFormat(new Date(timestamp), {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )}
      </span>
    </SidebarDiffItem>
  );
};

export default SavedDiffs;
