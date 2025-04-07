import css from './pdf-image-tools.module.css';
import RefreshSvg from 'components/shared/icons/refresh.svg';
import MinusSvg from 'components/shared/icons/minus.svg';
import PlusSvg from 'components/shared/icons/plus.svg';
import IconButton from 'components/shared/icon-button';
import DiffToggle from '../diff-toggle';
import { ImageEvent, type ImageState } from 'types/image-diff';
import { type DraggableData } from 'react-draggable';
import { t } from 'lib/react-tiny-i18n';

interface PdfImageToolsProps {
  state: ImageState;
  eventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  showEqual: boolean;
  setShowEqual: (value: boolean) => void;
}

const PdfImageTools: React.FC<PdfImageToolsProps> = ({
  state,
  eventHandler,
  showEqual,
  setShowEqual,
}) => {
  return (
    <>
      <div className={css.zoomContainer}>
        <div className={css.zoom}>
          <div className={css.buttonWrapper}>
            <IconButton
              svg={MinusSvg}
              style="text"
              tone="base"
              onClick={() => eventHandler(ImageEvent.ZOOM_OUT)}
            />
          </div>
          <span className={css.percentage}>{state.zoomFactor * 100}%</span>
          <div className={css.buttonWrapper}>
            <IconButton
              svg={PlusSvg}
              style="text"
              tone="base"
              onClick={() => eventHandler(ImageEvent.ZOOM_IN)}
            />
          </div>
        </div>
        <div className={css.mat}>
          <IconButton
            className={css.resetButton}
            svg={RefreshSvg}
            style="text"
            tone="base"
            onClick={() => eventHandler(ImageEvent.RESET)}
          />
        </div>
      </div>
      <div className={css.skip}>
        <DiffToggle
          label={t('PdfDiff.image.skipUnchangedPages')}
          currentValue={!showEqual}
          onValue={true}
          offValue={false}
          onClick={() => setShowEqual(!showEqual)}
        />
      </div>
    </>
  );
};

export default PdfImageTools;
