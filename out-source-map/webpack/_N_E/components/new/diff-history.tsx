import * as DiffActions from 'redux/modules/diff-module';
import diffRouter from 'lib/diff-router';
import formatter from 'lib/timeago-formatter';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import TimeAgo from 'react-timeago';
import { getDiffs } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { type Diff } from 'types/diff';

import css from './diff-history.module.css';
import SidebarDiffItem from './sidebar-diff-item';
import { intlFormat } from 'date-fns';

const DiffHistory: React.FC = () => {
  const recentDiffs = useAppSelector(getDiffs);
  const diffIndex = useAppSelector((state) => state.diff.diffIndex);

  return (
    <div className={css.container} key={recentDiffs.length}>
      {/* key added to prevent transitions and reset scroll on new diff */}
      {recentDiffs
        .map((diff, index) => (
          <DiffHistoryItem
            key={index}
            index={index}
            isSelected={index === diffIndex}
            slug={diff.slug}
            localTime={diff.localTime}
          />
        ))
        .reverse()}
    </div>
  );
};

interface DiffHistoryItemProps {
  index: number;
  isSelected?: boolean;
  slug?: string;
  localTime?: Diff['localTime'];
}

const DiffHistoryItem: React.FC<DiffHistoryItemProps> = ({
  index,
  isSelected,
  slug,
  localTime = new Date(),
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleChooseDiff = () => {
    Tracking.trackEvent('Clicked diff in sidebar', {
      type: 'history',
    });

    dispatch(DiffActions.actions.chooseDiff(index));
    const historyStr = slug || 'text-compare';
    diffRouter.push(
      '/',
      `/${historyStr}/`,
      historyStr,
      index,
      router.locale || 'en',
    );
  };

  return (
    <SidebarDiffItem
      isSelected={isSelected}
      onClick={handleChooseDiff}
      classNames={{
        base: css.historyItem,
        selected: css.selected,
        open: css.open,
        button: css.button,
      }}
    >
      <span className={css.content}>
        <span className={css.text}>
          <span className={css.timestamp}>
            {intlFormat(new Date(localTime), {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
          <span className={css.action}>
            <TimeAgo date={localTime} formatter={formatter} />
          </span>
        </span>
      </span>
    </SidebarDiffItem>
  );
};

export default DiffHistory;
