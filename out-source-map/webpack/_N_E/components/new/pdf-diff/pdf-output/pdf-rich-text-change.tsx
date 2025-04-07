/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
import Badge from 'components/shared/badge';
import css from './pdf-rich-text-change.module.css';
import { RichTextChangeItem, RichTextStyleChangeItem } from 'types/rich-text';
import React from 'react';
import cx from 'classnames';
import { t } from 'lib/react-tiny-i18n';
export const NUM_WORDS_TO_SHOW = 15;
export const NUM_WORDS_EXTRA_ALLOWED = 1;

interface RichTextChangeProps {
  change: RichTextChangeItem;
  showFontFamilyChanges: boolean;
  showFontSizeChanges: boolean;
  showFontColorChanges: boolean;
  isHovered: boolean;
  isSelected: boolean;
  className?: string;
  onChunkClick: (chunkId: number, event?: React.MouseEvent) => void;
  onChunkHover: (chunkId: number) => void;
}

const RichTextChange: React.FC<RichTextChangeProps> = ({
  change,
  showFontFamilyChanges,
  showFontSizeChanges,
  showFontColorChanges,
  isHovered,
  isSelected,
  className,
  onChunkClick,
  onChunkHover,
}) => {
  let innerContent: React.ReactNode;
  if (change.type !== 'style' && change.type !== 'move') {
    innerContent = (
      <RichTextContentChange text={change.text} type={change.type} />
    );
  } else if (change.type === 'move') {
    innerContent = (
      <RichTextMoveChange
        text={change.text}
        movedFromPage={change.movedFromPage}
        movedToPage={change.movedToPage}
      />
    );
  } else {
    // Style change.
    const fontFamilyChanged =
      showFontFamilyChanges && change.chunkBefore.fontFamilyChanged;
    const fontSizeChanged =
      showFontSizeChanges && change.chunkBefore.fontSizeChanged;
    const colorChanged =
      showFontColorChanges && change.chunkBefore.colorChanged;
    if (fontFamilyChanged || fontSizeChanged || colorChanged) {
      innerContent = (
        <RichTextStyleChange
          change={change}
          fontFamilyChanged={fontFamilyChanged}
          fontSizeChanged={fontSizeChanged}
          colorChanged={colorChanged}
        />
      );
    }
  }

  if (innerContent) {
    return (
      <div
        className={cx(
          css.log,
          className,
          isHovered && css.isHovered,
          isSelected && css.isSelected,
        )}
        id={`rich-text-change-${change.chunkId}`}
        onClick={(event) => onChunkClick(change.chunkId, event)}
        onMouseEnter={() => onChunkHover(change.chunkId)}
        onMouseLeave={() => onChunkHover(-1)}
      >
        {innerContent}
      </div>
    );
  }

  return <></>;
};

const Text: React.FC<{ text: string }> = ({ text }) => {
  let str = text;
  let additionalCount = <></>;
  const words = str.split(' ');

  if (words.length > NUM_WORDS_TO_SHOW + NUM_WORDS_EXTRA_ALLOWED) {
    str = words.slice(0, NUM_WORDS_TO_SHOW).join(' ');
    additionalCount = (
      <>
        <span className={css.moreWords}>
          {' '}
          +{words.length - NUM_WORDS_TO_SHOW} words
        </span>
      </>
    );
  }

  return (
    <div className={css.text}>
      <span>{str}</span>
      {additionalCount}
    </div>
  );
};

interface RichTextContentChangeProps {
  text: string;
  type: 'remove' | 'insert';
}

const RichTextContentChange: React.FC<RichTextContentChangeProps> = ({
  text,
  type,
}) => {
  const displayTexts = {
    remove: t('PdfDiff.richText.removed'),
    insert: t('PdfDiff.richText.added'),
  };
  const tones: Record<RichTextContentChangeProps['type'], 'red' | 'green'> = {
    remove: 'red',
    insert: 'green',
  };
  return (
    <>
      <Badge style="secondary" tone={tones[type]}>
        {displayTexts[type]}
      </Badge>
      <Text text={text} />
    </>
  );
};

interface RichTextMoveChangeProps {
  text: string;
  movedFromPage: number;
  movedToPage: number;
}

const RichTextMoveChange: React.FC<RichTextMoveChangeProps> = ({
  text,
  movedFromPage,
  movedToPage,
}) => {
  return (
    <>
      <Badge style="secondary" tone="blue">
        Moved
      </Badge>
      <div>
        <div className={css.movePageRange}>
          Page {movedFromPage} → Page {movedToPage}
        </div>
        <Text text={text} />
      </div>
    </>
  );
};

interface RichTextStyleChangeProps {
  change: RichTextStyleChangeItem;
  fontFamilyChanged: boolean;
  fontSizeChanged: boolean;
  colorChanged: boolean;
}

const RichTextStyleChange: React.FC<RichTextStyleChangeProps> = ({
  change,
  fontFamilyChanged,
  fontSizeChanged,
  colorChanged,
}) => {
  return (
    <>
      <Badge style="secondary" tone="purple">
        {t('PdfDiff.richText.formattingChanges')}
      </Badge>
      <Text text={change.text} />
      <div className={css.styleChanges}>
        {fontFamilyChanged && (
          <div className={css.styleChanged}>
            <span className={css.changedLabel}>Font:</span>{' '}
            <span className={css.changedTo}>
              {change.chunkBefore.fontFamily} → {change.chunkAfter.fontFamily}
            </span>
          </div>
        )}
        {fontSizeChanged && (
          <div className={css.styleChanged}>
            <span className={css.changedLabel}>Size:</span>{' '}
            <span className={css.changedTo}>
              {change.chunkBefore.fontSize} → {change.chunkAfter.fontSize}
            </span>
          </div>
        )}
        {colorChanged && (
          <div className={css.styleChanged}>
            <span className={css.changedLabel}>Color:</span>
            <br />
            <span className={css.changedTo}>
              <span
                className={css.colorBox}
                style={{
                  backgroundColor: change.chunkBefore.color,
                }}
              />{' '}
              {change.chunkBefore.color} →{' '}
              <span
                className={css.colorBox}
                style={{
                  backgroundColor: change.chunkAfter.color,
                }}
              />{' '}
              {change.chunkAfter.color}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default RichTextChange;
