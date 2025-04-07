import cx from 'classnames';
import Button from 'components/shared/button';
import IconButton from 'components/shared/icon-button';
import OkSvg from 'components/shared/icons/ok.svg';
import SwitchSvg from 'components/shared/icons/switch.svg';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import pluralize from 'pluralize';
import { useContext, useState } from 'react';
import { type DiffSide } from 'types/diffSide';

import CommentButton from 'components/comment/button';
import { CommentThread } from 'types/comment-thread';
import { Diff } from 'types/diff';
import DiffChangeStat from '../diff-change-stat';
import TextDiffUploadButton, {
  TextDiffUploadButtonProps,
} from '../text-diff/text-diff-upload-button';
import TextDiffOutputContext from './context';
import {
  TextDiffOutputSettingsObject,
  defaultTextDiffOutputSettings,
} from './settings';
import css from './details.module.css';
import Tooltip from 'components/new/tooltip';
import { DiffLevel, Meta } from 'types/normalize';

type TextDiffOutputDetailsProps = {
  diff: Diff;
  commentThreads?: CommentThread[];
  settings?: TextDiffOutputSettingsObject;
  showSwapSides?: boolean;
};
const TextDiffOutputDetails: React.FC<TextDiffOutputDetailsProps> = ({
  diff,
  commentThreads = [],
  settings = defaultTextDiffOutputSettings,
  showSwapSides,
}) => {
  const { api } = useContext(TextDiffOutputContext);

  return (
    <div className={css.details}>
      <DiffStat
        side="left"
        diff={diff}
        commentThreads={commentThreads}
        settings={settings}
      />
      <div className={css.spacer}>
        {showSwapSides && (
          <IconButton
            size="small"
            style="text"
            tone="base"
            svg={SwitchSvg}
            onClick={api.swapSides}
            aria-label="Swap diffs"
          />
        )}
      </div>
      <DiffStat
        side="right"
        diff={diff}
        commentThreads={commentThreads}
        settings={settings}
      />
    </div>
  );
};

interface CommentStatProps {
  commentThreads: CommentThread[];
  expanded: boolean;
  side: 'left' | 'right';
  onCommentButtonClick: () => void;
}

const CommentStat: React.FC<CommentStatProps> = ({
  commentThreads,
  side,
  expanded,
  onCommentButtonClick,
}) => {
  const commentThreadsForSide = commentThreads.filter(
    (commentThread) => commentThread.side === side,
  );
  const commentCountForSide = commentThreadsForSide.reduce(
    (count, commentThread) => commentThread.commentCount + count,
    0,
  );
  return (
    <div
      className={cx(
        css.commentStat,
        commentThreadsForSide && css.commentStatHasComments,
      )}
    >
      <CommentButton
        onClick={() => onCommentButtonClick()}
        highlight={!!commentThreadsForSide.length}
        toggled={expanded}
      >
        {commentThreadsForSide.length === 0 ? undefined : (
          <span className={css.commentStatCount}>{commentCountForSide}</span>
        )}
      </CommentButton>
    </div>
  );
};

interface DiffStatProps {
  diff: Diff;
  commentThreads: CommentThread[];
  settings: TextDiffOutputSettingsObject;
  side: DiffSide;
}

const DiffStat: React.FC<DiffStatProps> = ({
  diff,
  side,
  commentThreads,
  settings,
}) => {
  const { added, removed, rows = [] } = diff;

  const { api, openCommentLocations } = useContext(TextDiffOutputContext);

  const isLiveDiff = settings.diffVersion === 'live';
  const isLeft = side === 'left';
  const changed = isLeft ? removed : added;

  const lines = rows.reduce(
    (acc, row) => (row[side]?.chunks.length !== 0 ? acc + 1 : acc),
    0,
  );

  const calculateStats = (rows: Meta[], diffLevel: DiffLevel) => {
    const isWordLevel = diffLevel === 'word';
    return rows.reduce(
      (stats, row) => {
        const chunks = row[side]?.chunks || [];
        for (const chunk of chunks) {
          const value = chunk.value;
          const count = isWordLevel
            ? value.split(' ').filter(Boolean).length // filter out empty strings
            : value.length;
          stats.total += count;
          if (chunk.type !== 'equal') {
            stats.modified += count;
          }
        }
        return stats;
      },
      {
        modified: 0,
        total: 0,
      },
    );
  };

  const { modified, total } = calculateStats(rows, settings.diffLevel);
  const percentageModified =
    total === 0 ? '0.00' : ((modified / total) * 100).toFixed(2);

  const commentThreadsForSide = commentThreads.filter(
    (commentThread) => commentThread.side === side,
  );

  const openCommentLocationsForSide = openCommentLocations.filter(
    (openCommentLocation) => openCommentLocation.side === side,
  );

  const allCommentsForSideAreOpen =
    commentThreadsForSide.length === openCommentLocationsForSide.length &&
    openCommentLocationsForSide.length > 0;

  const diffUploadButtonProps: TextDiffUploadButtonProps | undefined =
    isLiveDiff
      ? {
          label: isLeft
            ? t('TextDiff.originalTextUpload')
            : t('TextDiff.changedTextUpload'),
          onChange: (
            result: string | { file: File; data: string | ArrayBuffer | null },
          ): void => {
            if (typeof result !== 'string' && typeof result.data === 'string') {
              api.replaceSide(side, result.data);
            }
          },
          side,
        }
      : undefined;
  const hasCommentCountForSide = !!commentThreadsForSide.reduce(
    (count, commentThread) => commentThread.commentCount + count,
    0,
  );
  return (
    <div className={css.stat}>
      <div className={cx(css.changed, isLeft ? css.removal : css.addition)}>
        <Tooltip
          content={
            <table>
              <tbody>
                <tr>
                  <td className={css.tooltipHeader}>
                    {settings.diffLevel === 'word' ? 'Words' : 'Characters'}
                    {isLeft ? ' removed' : ' added'}
                  </td>
                  <td className={css.tooltipValue}>{modified}</td>
                </tr>
                <tr>
                  <td className={css.tooltipHeader}>
                    {settings.diffLevel === 'word'
                      ? 'Total words'
                      : 'Total characters'}
                  </td>
                  <td className={css.tooltipValue}>{total}</td>
                </tr>
                <tr>
                  <td className={css.tooltipHeader}>
                    {settings.diffLevel === 'word' ? 'Words' : 'Characters'}
                    {isLeft ? ' removed' : ' added'} (%)
                  </td>
                  <td className={css.tooltipValue}>{percentageModified}</td>
                </tr>
              </tbody>
            </table>
          }
          position="bottom"
        >
          <DiffChangeStat
            amount={changed || 0}
            type={isLeft ? 'removal' : 'addition'}
          />
        </Tooltip>
      </div>
      <div className={css.lines}>
        {hasCommentCountForSide && (
          <CommentStat
            side={side}
            commentThreads={commentThreads}
            expanded={allCommentsForSideAreOpen}
            onCommentButtonClick={() => {
              if (!allCommentsForSideAreOpen) {
                api.openAllComments(side);
              } else {
                api.closeAllComments(side);
              }
            }}
          />
        )}

        <span className={css.lineCount}>
          {lines} {pluralize('line', lines)}
        </span>

        <div className={css.buttons}>
          {!!diffUploadButtonProps && (
            <div className={css.openFileButtonContainer}>
              <TextDiffUploadButton {...diffUploadButtonProps}>
                <DiffDetailsButton asSpan>Open file</DiffDetailsButton>
              </TextDiffUploadButton>
            </div>
          )}
          <div className={cx({ [css.hidden]: diffUploadButtonProps })}>
            <CopyButton diff={diff} side={side} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface DiffDetailsButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  iconStartSvg?: React.FC<React.SVGProps<SVGSVGElement>>;
  asSpan?: boolean;
}

const DiffDetailsButton: React.FC<
  React.PropsWithChildren<DiffDetailsButtonProps>
> = ({ onClick, disabled, iconStartSvg, asSpan, children }) => {
  const fakeButtonProps = asSpan ? { asSpan: true } : {};
  return (
    <Button
      style="text"
      tone="base"
      onClick={onClick}
      iconStartSvg={iconStartSvg}
      disabled={disabled}
      className={css.button}
      {...fakeButtonProps}
    >
      {children}
    </Button>
  );
};

interface CopyButtonProps {
  diff: Diff;
  side: DiffSide;
}

const CopyButton: React.FC<CopyButtonProps> = ({ diff, side }) => {
  const [recentlyCopied, setRecentlyCopied] = useState(false);

  const { left, right } = diff;

  const isLeft = side === 'left';
  const text = isLeft ? left : right;

  const handleCopy = (): void => {
    Tracking.trackEvent('Clicked diff button', {
      diffButton: 'copy',
      side,
    });
    if (text) {
      void navigator.clipboard.writeText(text);
    }
    setRecentlyCopied(true);
    setTimeout(() => {
      setRecentlyCopied(false);
    }, 2000);
  };

  return (
    <DiffDetailsButton
      onClick={handleCopy}
      iconStartSvg={recentlyCopied ? OkSvg : undefined}
      disabled={recentlyCopied}
      key={recentlyCopied ? 'disabled' : 'enabled'}
    >
      {recentlyCopied ? t('DiffDetails.copied') : t('DiffDetails.copyAll')}
    </DiffDetailsButton>
  );
};

export default TextDiffOutputDetails;
