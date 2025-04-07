import * as React from 'react';
import { captureException } from 'lib/sentry';
import { useEffect, useState } from 'react';
import Draggable, { type DraggableData } from 'react-draggable';
import css from './image-diff-output-downloadable.module.css';

import { ImageEvent, type ImageState } from '../types/image-diff';
import LoadingCircle from './shared/loaders/loading-circle';

interface ImageDiffOutputDownloadableProps {
  originalUrl: string;
  changedUrl: string;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  pdfDiff?: boolean;
  pdfUrl?: string;
  originalHeight?: number;
  originalWidth?: number;
}

const ImageDiffOutputDownloadable = (
  props: ImageDiffOutputDownloadableProps,
): JSX.Element => {
  const [diffUrl, setDiffUrl] = useState('');
  const [computingDiff, setComputingDiff] = useState(false);

  useEffect(() => {
    const computeDiff = async (): Promise<void> => {
      const resemble = (await import('resemblejs')).default;
      resemble(props.originalUrl)
        .compareTo(props.changedUrl)
        .onComplete((data) => {
          if (data.getImageDataUrl) {
            setDiffUrl(data.getImageDataUrl());
          } else {
            captureException('Did not get proper resemble data', {
              contexts: {
                Context: {
                  ...data,
                },
              },
            });
          }
          setComputingDiff(false);
        });
    };

    if (!props.pdfDiff) {
      setComputingDiff(true);
      setTimeout(() => {
        computeDiff();
      }, 0);
    } else if (props.pdfUrl) {
      setDiffUrl(props.pdfUrl);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.originalUrl,
    props.changedUrl,
    props.pdfDiff,
    props.pdfUrl,
    props.originalHeight,
    props.originalWidth,
  ]);

  return computingDiff ? (
    <div className={css.loader}>
      <LoadingCircle />
      <span>Computing Highlight Diff...</span>
    </div>
  ) : (
    <div className={css.imageDiffOutputDownloadableContainer}>
      <div
        className={css.imageDiffOutputDownloadable}
        style={{
          transform: `scale(${props.imageState.zoomFactor})`,
        }}
      >
        <Draggable
          onDrag={(_ev, data) => props.imageEventHandler(ImageEvent.DRAG, data)}
          position={{ x: props.imageState.x, y: props.imageState.y }}
          scale={props.imageState.zoomFactor}
        >
          <span className={css.draggableContainer}>
            <img className={css.image} src={diffUrl || ''} alt="Computed" />
          </span>
        </Draggable>
      </div>
    </div>
  );
};

export default ImageDiffOutputDownloadable;
