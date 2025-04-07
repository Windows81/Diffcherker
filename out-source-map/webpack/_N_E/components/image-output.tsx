import { ImageDiffOutputTypes, NewOutputType } from 'lib/output-types';
import css from './image-output.module.css';
import DiffOutputTypeSwitch from './new/diff-output-type-switch';
import SplitSvg from 'components/shared/icons/split.svg';
import FadeSvg from 'components/shared/icons/fade.svg';
import HighlightSvg from 'components/shared/icons/highlight.svg';
import SliderSvg from 'components/shared/icons/slider.svg';
import DifferenceSvg from 'components/shared/icons/difference.svg';
import DetailsSvg from 'components/shared/icons/details.svg';
import ImageDiffTools from './image-diff-tools';
import { ImageDiffState, ImageEvent, ImageState } from 'types/image-diff';
import { useCallback, useState } from 'react';
import { DraggableData } from 'react-draggable';
import Tracking from 'lib/tracking';
import { DiffInputType } from 'types/diff-input-type';
import ImageDiffOutput from './image-diff-output';
import bytes from 'bytes';
import cx from 'classnames';
import ExportErrorMessageBanner from './shared/export-error-message-banner';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import {
  ExportProgressState,
  ExportProgress,
  IMAGE_PAGE_SELECTOR,
} from './new/pdf-diff/pdf-output/commands/image-export-types-and-selectors';
import { experiments } from 'redux/modules/ab-test-module';
import Modal from 'components/shared/modal';
import { useAppSelector } from 'redux/store';

const allOutputTypes: NewOutputType<ImageDiffOutputTypes>[] = [
  { icon: SplitSvg, name: ImageDiffOutputTypes.Split },
  { icon: FadeSvg, name: ImageDiffOutputTypes.Fade },
  { icon: SliderSvg, name: ImageDiffOutputTypes.Slider },
  { icon: DifferenceSvg, name: ImageDiffOutputTypes.Difference },
  { icon: HighlightSvg, name: ImageDiffOutputTypes.Highlight },
  { icon: DetailsSvg, name: ImageDiffOutputTypes['File details'] },
];

interface ImageOutputProps {
  leftState: ImageDiffState;
  rightState: ImageDiffState;
  showExportButton?: boolean;
}

export function ImageOutput({
  leftState,
  rightState,
  showExportButton = true,
}: ImageOutputProps) {
  const imageDiffOutputType = useAppSelector(
    (state) =>
      state.abTest.experiments[
        experiments['2025-02-04-image-diff-output-type'].id
      ],
  );
  const [outputType, setOutputType] = useState(
    imageDiffOutputType === 'fade'
      ? ImageDiffOutputTypes.Fade
      : ImageDiffOutputTypes.Slider,
  );
  const [imageState, setImageState] = useState<ImageState>({
    x: 0,
    y: 0,
    zoomFactor: 1,
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    state: ExportProgressState.NotExporting,
    message: null,
  });

  const changeOutputType = (type: ImageDiffOutputTypes) => {
    setOutputType(type);
    imageEventHandler(ImageEvent.RESET);
    Tracking.trackEvent('Changed diff output type', {
      diffInputType: DiffInputType.IMAGE,
      changedTo: type,
    });
  };
  const imageEventHandler = useCallback(
    (eventType: ImageEvent, dragData?: DraggableData) => {
      if (eventType === ImageEvent.RESET) {
        setImageState({
          x: 0,
          y: 0,
          zoomFactor: 1,
        });
      } else if (
        eventType === ImageEvent.ZOOM_IN ||
        eventType === ImageEvent.ZOOM_OUT
      ) {
        // IMAGE TODO: old zoom logic, maybe needs updating.
        setImageState((oldState) => {
          const newZoomFactor =
            oldState.zoomFactor * (eventType === ImageEvent.ZOOM_IN ? 2 : 0.5);
          return {
            ...oldState,
            zoomFactor: newZoomFactor,
          };
        });
      } else if (eventType === ImageEvent.DRAG) {
        if (dragData) {
          setImageState((oldState) => {
            return {
              ...oldState,
              x: oldState.x + dragData.deltaX,
              y: oldState.y + dragData.deltaY,
              zoomFactor: oldState.zoomFactor,
            };
          });
        }
      }
    },
    [],
  );

  return (
    <>
      <div className={css.toolbar}>
        <DiffOutputTypeSwitch
          onTypeChange={changeOutputType}
          outputTypes={allOutputTypes}
          currentlySelectedType={outputType}
        />
        <ImageDiffTools
          state={imageState}
          eventHandler={imageEventHandler}
          showExportButton={showExportButton}
          setExportProgress={setExportProgress}
        />
      </div>
      {exportProgress.state === ExportProgressState.ExportFailed && (
        <ExportErrorMessageBanner title="Error exporting diff" />
      )}
      {/* IMAGE TODO: TEMP OLD COMPONENT USED HERE, image-diff needs more discussion on how to handle tech debt of old image diff modes.
      For image diff this is probably a high priority issue to get right with the redesign. */}
      <div className={css.diffContainer}>
        <div className={cx(css.output, IMAGE_PAGE_SELECTOR)} id="displayArea">
          <ImageDiffOutput
            original={leftState.url}
            changed={rightState.url}
            originalArrayBuffer={leftState.arrayBuffer}
            changedArrayBuffer={rightState.arrayBuffer}
            originalFilename={leftState.fileName}
            changedFilename={rightState.fileName}
            imageHeight={rightState.height}
            imageWidth={rightState.width}
            originalHeight={leftState.height}
            originalWidth={leftState.width}
            originalSize={bytes(parseFloat(leftState.size.toString()))}
            changedHeight={rightState.height}
            changedWidth={rightState.width}
            changedSize={bytes(parseFloat(rightState.size.toString()))}
            type={outputType}
            imageState={imageState}
            imageEventHandler={imageEventHandler}
          />
        </div>
        <Modal
          noCloseButton
          isOpen={exportProgress.state === ExportProgressState.Exporting}
          minWidth="0"
        >
          <div className={css.exportLoad}>
            <LoadingCircle size="small" />
            <div>
              <div>{exportProgress.message}</div>
              <div className={css.exportDesc}>
                Large documents or complex diffs may take longer.
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
