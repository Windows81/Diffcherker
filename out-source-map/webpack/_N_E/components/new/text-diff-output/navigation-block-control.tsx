import Button from 'components/shared/button';
import ArrowDownSvg from 'components/shared/icons/arrow-down.svg';
import ArrowUpSvg from 'components/shared/icons/arrow-up.svg';

import Tracking from 'lib/tracking';
import { useContext } from 'react';

import css from './navigation-block-control.module.css';
import { t } from 'lib/react-tiny-i18n';
import TextDiffOutputContext from './context';

const NavigationBlockControl: React.FC = () => {
  const { diff, selectedBlock, api } = useContext(TextDiffOutputContext);

  const blocks = diff.blocks ?? [];

  const changedDiffBlocks = blocks.filter(
    (block) => !(block.type.left == 'equal' && block.type.right == 'equal'),
  );

  let selectedChangedBlockIndex = 0;
  let isLastChangedBlockSelected = false;
  let isFirstChangedBlockSelected = false;

  if (selectedBlock) {
    selectedChangedBlockIndex = changedDiffBlocks.indexOf(selectedBlock);
    isFirstChangedBlockSelected = selectedChangedBlockIndex === 0;
    isLastChangedBlockSelected =
      selectedChangedBlockIndex === changedDiffBlocks.length - 1;
  }

  const clickArrow = (direction: 'up' | 'down') => {
    Tracking.trackEvent('Clicked arrow', { type: direction });

    let selectBlock;
    if (direction === 'down' && !isLastChangedBlockSelected) {
      selectBlock = changedDiffBlocks[selectedChangedBlockIndex + 1];
    }

    if (direction === 'up' && !isFirstChangedBlockSelected) {
      selectBlock = changedDiffBlocks[selectedChangedBlockIndex - 1];
    }

    if (selectBlock) {
      const newBlockIndex = blocks.indexOf(selectBlock);
      api.selectBlock(newBlockIndex);
      api.scrollToBlock(newBlockIndex);
    }
  };

  const currentChangeIndex = selectedBlock
    ? changedDiffBlocks.indexOf(selectedBlock) + 1
    : 1;

  return (
    <div className={css.outerContainer}>
      <div className={css.container}>
        <div className={css.side}>
          <div className={css.changeDetails}>
            <strong>Change</strong>{' '}
            <span className={css.changeNumerator}>
              <span className={css.changeNumeratorSpacer}>
                {changedDiffBlocks.length}
              </span>
              <span className={css.changeNumeratorValue}>
                {currentChangeIndex ?? 0}
              </span>
            </span>{' '}
            of {changedDiffBlocks.length}
          </div>
          <Button
            style="secondary"
            tone="base"
            iconStartSvg={ArrowUpSvg}
            disabled={isFirstChangedBlockSelected}
            onClick={() => {
              clickArrow('up');
            }}
          >
            {t('DiffEditorHeader.previous')}
          </Button>
          <Button
            style="secondary"
            tone="base"
            iconStartSvg={ArrowDownSvg}
            disabled={isLastChangedBlockSelected}
            onClick={() => {
              clickArrow('down');
            }}
          >
            {t('DiffEditorHeader.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavigationBlockControl;
