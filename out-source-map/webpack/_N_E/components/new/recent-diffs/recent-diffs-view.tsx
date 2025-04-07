import { useState, useEffect } from 'react';
import * as electron from '../../../lib/state/electron';
import css from './recent-diffs-view.module.css';
import SwitchSvg from 'components/shared/icons/switch.svg';
import EllipsisHorizontalSvg from 'components/shared/icons/ellipsis-horizontal.svg';
import Icon from 'components/shared/icon';
import Dropdown from 'components/shared/dropdown';
import FileItem from './file-item';

import cx from 'classnames';

import {
  getRecentDiffs,
  RecentDiff,
  deleteRecentDiff,
} from './commands/recent-diff-utils';
import { DiffInputType } from 'types/diff-input-type';
import Link from 'next/link';
import TimeAgo from 'react-timeago';
import formatter from 'lib/timeago-formatter';

export const diffPages: Record<DiffInputType, string> = {
  text: process.env.NODE_ENV === 'production' ? '' : 'index',
  image: 'image-compare',
  pdf: 'word-pdf-compare',
  excel: 'excel-compare',
  folder: 'folder-compare',
};

const RecentDiffsView = () => {
  const [recentDiffs, setRecentDiffs] = useState<RecentDiff[]>([]);
  const [openedDropdown, setOpenedDropdown] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const diffs = getRecentDiffs();
    setRecentDiffs(diffs);

    electron.storeSubscribe('recent.diffs', (diffs) => {
      setRecentDiffs(diffs as RecentDiff[]);
    });
  }, []);

  const recentDiffsLength = recentDiffs.length;
  const accentStartingIndex = recentDiffsLength % 2;

  return (
    <div className={css.view}>
      <h1 className={css.title}>Recent</h1>
      <div className={cx(css.recentDiffsContainer)}>
        {recentDiffsLength !== 0 ? (
          <div className={css.filesList}>
            {recentDiffs.map((diff, index) => {
              const { left, right, diffType } = diff;

              const leftFilePath = left.filePath;
              const rightFilePath = right.filePath;

              const leftName = diff.left.fileName;
              const rightName = diff.right.fileName;

              const pageName = diffPages[diffType];
              const query = new URLSearchParams();

              query.set('leftPath', leftFilePath);
              query.set('rightPath', rightFilePath);

              const href = `/${pageName}?${query.toString()}`;

              return (
                <div key={index} className={css.rowView}>
                  <Link
                    href={href}
                    className={cx(
                      css.row,
                      // slight trick to always ensure the last item has accent
                      css[index % 2 === accentStartingIndex ? 'accent' : ''],
                      openedDropdown != null && css.disablePointerEvents,
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`Compare ${leftName} with ${rightName}`}
                  >
                    <FileItem
                      diffType={diffType}
                      name={leftName}
                      filePath={leftFilePath}
                      subheader={diffType == DiffInputType.TEXT && 'Text'}
                    />
                    <Icon
                      size="small"
                      svg={SwitchSvg}
                      className={css.swapSvg}
                    />
                    <FileItem
                      diffType={diffType}
                      name={rightName}
                      filePath={rightFilePath}
                      subheader={diffType == DiffInputType.TEXT && 'Text'}
                    />
                    <div className={css.endContent}>
                      <Dropdown
                        isOpen={openedDropdown === index}
                        setIsOpen={(prev: boolean) => {
                          setOpenedDropdown(prev ? index : undefined);
                        }}
                        closeDropdownOnClick={false}
                        maxHeight={320}
                        display={
                          <div className={css.ellipsisContainer}>
                            <Icon
                              size="default"
                              svg={EllipsisHorizontalSvg}
                              className={css.svg}
                            />
                          </div>
                        }
                        buttonClassName={css.dropdownButton}
                        menuClassName={css.menu}
                        rightAlign
                      >
                        <div className={css.dropdownContent}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              deleteRecentDiff(
                                leftFilePath,
                                rightFilePath,
                                diffType,
                              );
                              setOpenedDropdown(undefined);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </Dropdown>
                      <TimeAgo date={diff.lastOpened} formatter={formatter} />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={css.emptyRecentDiffs}>
            <h1>No recent diffs</h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDiffsView;
