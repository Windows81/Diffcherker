import { DraggableData } from 'react-draggable';
import { ImageEvent, ImageState } from 'types/image-diff';
import Button from './shared/button';
import css from './image-diff-tools.module.css';
import RefreshSvg from 'components/shared/icons/refresh.svg';
import MinusSvg from 'components/shared/icons/minus.svg';
import PlusSvg from 'components/shared/icons/plus.svg';
import ImageSvg from 'components/shared/icons/image.svg';
import IconButton from './shared/icon-button';
import { DiffInputType } from 'types/diff-input-type';
import { DiffFeature } from 'lib/diff-features';
import { useDesktopModal } from 'components/new/desktop-modal/context';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import {
  ExportType,
  ExportProgress,
} from './new/pdf-diff/pdf-output/commands/image-export-types-and-selectors';
import { t } from 'lib/react-tiny-i18n';

interface ImageDiffToolsProps {
  state: ImageState;
  eventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  showExportButton: boolean;
  setExportProgress: (exportProgress: ExportProgress) => void;
}

const ImageDiffTools: React.FC<ImageDiffToolsProps> = ({
  state,
  eventHandler,
  showExportButton,
  setExportProgress,
}) => {
  const isPro = useAppSelector(isProUser);
  const { openDesktopModal } = useDesktopModal();

  const onExport = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();

    const { handleExport } = await import(
      './new/pdf-diff/pdf-output/commands/image-export-functions'
    );

    await handleExport(
      DiffInputType.IMAGE,
      ExportType.PNG,
      DiffFeature.EXPORT_IMAGE_DIFF_PNG,
      isPro,
      openDesktopModal,
      setExportProgress,
    );
  };

  return (
    <div className={css.toolContainer}>
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
        <Button
          iconStartSvg={RefreshSvg}
          style="text"
          tone="base"
          onClick={() => eventHandler(ImageEvent.RESET)}
        >
          {t('ImageDiff.resetButton')}
        </Button>
      </div>
      {showExportButton && (
        <div className={css.mat}>
          <Button
            iconStartSvg={ImageSvg}
            style="text"
            tone="base"
            onClick={onExport}
          >
            {t('DiffEditorHeader.exportAsPng')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageDiffTools;
