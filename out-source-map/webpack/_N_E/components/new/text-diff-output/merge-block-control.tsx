import Button from 'components/shared/button';
import IconButton from 'components/shared/icon-button';
import CancelSvg from 'components/shared/icons/cancel.svg';
import ChevronLeftSvg from 'components/shared/icons/chevron-left.svg';
import ChevronRightSvg from 'components/shared/icons/chevron-right.svg';

import Tracking from 'lib/tracking';
import { useContext } from 'react';

import css from './merge-block-control.module.css';
import { t } from 'lib/react-tiny-i18n';
import TextDiffOutputContext from './context';

const MergeControl: React.FC = () => {
  const { api } = useContext(TextDiffOutputContext);

  return (
    <div className={css.outerContainer}>
      <div className={css.container}>
        <div className={css.side}>
          <Button
            style="primary"
            tone="red"
            iconEndSvg={ChevronRightSvg}
            onClick={() => api.merge('ltr')}
          >
            {t('DiffEditorHeader.merge')}
          </Button>
        </div>
        <IconButton
          style="text"
          tone="base"
          svg={CancelSvg}
          className={css.cancelButton}
          onClick={() => {
            Tracking.trackEvent('Ended diff merge');
            api.endSelection();
          }}
          aria-label="Cancel merge"
        />
        <div className={css.side}>
          <Button
            style="primary"
            tone="green"
            iconStartSvg={ChevronLeftSvg}
            onClick={() => api.merge('rtl')}
          >
            {t('DiffEditorHeader.merge')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MergeControl;
