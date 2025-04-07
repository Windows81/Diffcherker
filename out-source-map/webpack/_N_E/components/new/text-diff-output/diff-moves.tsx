/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import css from './diff-moves.module.css';
import { useContext } from 'react';
import TextDiffOutputContext from './context';
import { MovedTo } from 'types/moves';
import Tracking from 'lib/tracking';

type DiffMovesProps = {
  deletionMovedTo?: MovedTo | null;
  insertionMovedTo?: MovedTo | null;
  paddingSize: number;
};

const DiffMoves: React.FC<DiffMovesProps> = ({
  paddingSize,
  deletionMovedTo,
  insertionMovedTo,
}) => {
  const { api } = useContext(TextDiffOutputContext);

  return (
    <div className={css.movedLineTextContainer}>
      <div
        className={css.halfWidthLeft}
        style={{
          paddingLeft: `${paddingSize}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={css.movedLineText}
          onClick={(e) => {
            e.stopPropagation();
            // will also catch undefined
            if (deletionMovedTo) {
              api.scrollToLine(deletionMovedTo?.movedToStart, 'right');
              Tracking.trackEvent('Clicked code move', {
                originSide: 'left',
              });
            }
          }}
        >
          {deletionMovedTo &&
            `Text moved ${deletionMovedTo.score < 1 ? 'with changes ' : ''}to lines ${deletionMovedTo.movedToStart}-${deletionMovedTo.movedToEndExclusive - 1} ${deletionMovedTo.score < 1 ? `(${(deletionMovedTo.score * 100).toFixed(1)}% similarity)` : ''}`}
        </span>
      </div>
      <div
        className={css.halfWidthRight}
        style={{
          paddingLeft: `${paddingSize}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={css.movedLineText}
          onClick={(e) => {
            e.stopPropagation();
            if (insertionMovedTo) {
              api.scrollToLine(insertionMovedTo?.movedToStart, 'left');
              Tracking.trackEvent('Clicked code move', {
                originSide: 'right',
              });
            }
          }}
        >
          {insertionMovedTo &&
            `Text moved ${insertionMovedTo.score < 1 ? 'with changes ' : ''}from lines ${insertionMovedTo.movedToStart}-${insertionMovedTo.movedToEndExclusive - 1} ${insertionMovedTo.score < 1 ? `(${(insertionMovedTo.score * 100).toFixed(1)}% similarity)` : ''}`}
        </span>
      </div>
    </div>
  );
};

export default DiffMoves;
