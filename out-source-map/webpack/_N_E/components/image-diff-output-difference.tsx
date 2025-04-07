import Draggable, { type DraggableData } from 'react-draggable';

import { ImageEvent, type ImageState } from '../types/image-diff';
import { useEffect, useRef, useState } from 'react';
import css from './image-diff-output-difference.module.css';
import calculateDisplayArea from 'lib/calculate-display-area';

interface ImageDiffOutputDifferenceProps {
  original: string;
  changed: string;
  originalHeight: number;
  originalWidth: number;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  pdfDiff?: boolean;
}

const ImageDiffOutputDifference: React.FC<ImageDiffOutputDifferenceProps> = (
  props,
) => {
  const [displayHeight, setDisplayHeight] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleResize = (defaultWidth: number) => {
    const { w, h } = calculateDisplayArea(
      defaultWidth,
      props.originalHeight,
      props.originalWidth,
      ref.current,
    );
    setDisplayWidth(w);
    setDisplayHeight(h);
  };

  useEffect(() => {
    if (props.pdfDiff) {
      setDisplayHeight(props.originalHeight);
      setDisplayWidth(props.originalWidth);
    }

    const resizeWithArgs = () => handleResize(props.originalWidth);

    const observer = new ResizeObserver(resizeWithArgs);
    const divRef = ref.current;

    if (divRef) {
      observer.observe(divRef);
    }

    return () => {
      if (divRef) {
        observer.unobserve(divRef);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pdfDiff, props.originalHeight, props.originalWidth]);

  const imageRatio = props.originalWidth / props.originalHeight;
  const displayRatio = displayWidth / displayHeight;
  const isVertical = imageRatio < displayRatio;

  const style = {
    height:
      imageRatio && isVertical ? displayHeight : displayWidth / imageRatio,
    width: imageRatio && isVertical ? displayHeight * imageRatio : displayWidth,
    maxWidth: '100%',
  };

  const containerStyle = {
    height: style.height * 1.05,
    width: style.width * 1.05,
    maxWidth: '100%',
  };

  return (
    <div className={css.imageDiffOutputDifferenceContainer} ref={ref}>
      <div
        className={css.imageDiffOutputDifference}
        style={{
          transform: `scale(${props.imageState.zoomFactor})`,
          ...containerStyle,
        }}
      >
        <Draggable
          onDrag={(_ev, data) => props.imageEventHandler(ImageEvent.DRAG, data)}
          position={{
            x: props.imageState.x,
            y: props.imageState.y + containerStyle.width * 0.015,
          }}
          scale={props.imageState.zoomFactor}
        >
          <div className={css.result} style={style}>
            <div className={css.before} style={style}>
              <img src={props.original} alt="before" />
            </div>
            <div className={css.after} style={style}>
              <img
                src={props.changed}
                alt="after"
                style={{ mixBlendMode: 'difference' }}
              />
            </div>
          </div>
        </Draggable>
      </div>
    </div>
  );
};

export default ImageDiffOutputDifference;
