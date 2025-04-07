import css from './explain-block-pane.module.css';
import { FC, useContext, useState } from 'react';
import SparkleSvg from 'components/shared/icons/sparkle.svg';
import RefreshSvg from 'components/shared/icons/refresh.svg';
import Icon from 'components/shared/icon';
import Button from 'components/shared/button';
import CancelSvg from 'components/shared/icons/cancel.svg';
import ExplainContext from 'components/explain/context';
import ThumbsUp from 'components/shared/icons/thumbs-up.svg';
import ThumbsDown from 'components/shared/icons/thumbs-down.svg';
import IconButton from 'components/shared/icon-button';
import Tracking from 'lib/tracking';
import TextDiffOutputContext, { nullExplainItem } from './context';
import dynamic from 'next/dynamic';

const ExplainOutput = dynamic(() => import('components/explain/output'), {
  ssr: false,
});

const ExplainBlockPane: FC = () => {
  const {
    explanation,
    isExplaining,
    isWaitingForExplain,
    isShowingError,
    explain,
    reset,
  } = useContext(ExplainContext);

  const {
    api,
    selectedDiffBlockLeftText,
    selectedDiffBlockRightText,
    selectedBlock: diffBlock,
  } = useContext(TextDiffOutputContext);

  const explainBlockItem =
    (diffBlock && api.getExplainBlockItemFor(diffBlock)) ?? nullExplainItem;

  const [providedFeedback, setProvidedFeedback] = useState<
    'good' | 'bad' | undefined
  >(explainBlockItem.feedback);

  const showRegenerate = explanation && !isExplaining;

  return (
    <div className={css.explainPane}>
      <div className={css.explainPaneContainer}>
        <div className={css.header}>
          <h2 className={css.headerTitle}>
            <Icon svg={SparkleSvg} /> Explain
          </h2>
          <IconButton
            style="text"
            tone="base"
            svg={CancelSvg}
            aria-label="Close explanation"
            onClick={() => reset()}
          />
        </div>
        {(isWaitingForExplain || explanation) && (
          <ExplainOutput
            isWaitingForExplain={isWaitingForExplain}
            explanation={explanation}
          />
        )}
      </div>
      {isShowingError ? (
        <div className={css.footer}>
          <Button
            style="primary"
            tone="purple"
            fullWidth
            href="/contact"
            nextLink
          >
            Contact Us
          </Button>
        </div>
      ) : (
        showRegenerate && (
          <div className={css.footer}>
            <Button
              style="primary"
              tone="purple"
              iconStartSvg={RefreshSvg}
              isLoading={isExplaining}
              onClick={() => {
                Tracking.trackEvent('Clicked explain', {
                  button: 'regenerate',
                });
                setProvidedFeedback(undefined);
                explain({
                  left: selectedDiffBlockLeftText,
                  right: selectedDiffBlockRightText,
                });
              }}
            >
              Regenerate
            </Button>

            <IconButton
              svg={ThumbsUp}
              style="secondary"
              tone={providedFeedback === 'good' ? 'green' : 'base'}
              aria-label="Thumbs Up"
              onClick={() => {
                if (diffBlock) {
                  api.setExplainBlockItemFor(diffBlock, {
                    ...explainBlockItem,
                    feedback: 'good',
                  });
                  Tracking.trackEvent('Clicked explain feedback', {
                    type: 'positive',
                  });
                  setProvidedFeedback('good');
                }
              }}
            />
            <IconButton
              svg={ThumbsDown}
              style="secondary"
              tone={providedFeedback === 'bad' ? 'red' : 'base'}
              aria-label="Thumbs Down"
              onClick={() => {
                if (diffBlock) {
                  api.setExplainBlockItemFor(diffBlock, {
                    ...explainBlockItem,
                    feedback: 'bad',
                  });
                  Tracking.trackEvent('Clicked explain feedback', {
                    type: 'negative',
                  });
                  setProvidedFeedback('bad');
                }
              }}
            />
          </div>
        )
      )}
    </div>
  );
};

export default ExplainBlockPane;
