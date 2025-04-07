import ExplainContext from 'components/explain/context';
import { FC, useContext } from 'react';
import Button from 'components/shared/button';
import css from './explain-block-control.module.css';
import SparkleSvg from 'components/shared/icons/sparkle.svg';
import Tracking from 'lib/tracking';
import TextDiffOutputContext from './context';
import { DiffFeature } from 'lib/diff-features';

type ExplainBlockControlProps = {
  blockIndex: number;
};

const ExplainBlockControl: FC<ExplainBlockControlProps> = ({ blockIndex }) => {
  const { explain, isExplaining, hasExplanation } = useContext(ExplainContext);
  const { api, selectedDiffBlockLeftText, selectedDiffBlockRightText } =
    useContext(TextDiffOutputContext);

  const disableButton = isExplaining || hasExplanation;

  const explainBlock = () => {
    explain({
      left: selectedDiffBlockLeftText,
      right: selectedDiffBlockRightText,
    });
  };

  const handleClick = async () => {
    Tracking.trackEvent('Clicked explain', { button: 'main' });
    if (window.outerWidth <= 1024) {
      api.scrollToBlock(blockIndex);
    }

    if (api.checkFeatureUsage(DiffFeature.EXPLAIN)) {
      explainBlock();
    }
  };

  return (
    <div className={css.explainBlockControl}>
      <Button
        style="primary"
        tone="purple"
        iconStartSvg={SparkleSvg}
        disabled={disableButton}
        onClick={handleClick}
      >
        Explain
      </Button>
    </div>
  );
};

export default ExplainBlockControl;
