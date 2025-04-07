import React, { useState, useEffect, useRef } from 'react';

import Draggable, { type DraggableData } from 'react-draggable';

import { ImageEvent, type ImageState } from '../types/image-diff';
import css from './image-diff-output-fade.module.css';
import cx from 'classnames';
import calculateDisplayArea from 'lib/calculate-display-area';
import { HIDE_DURING_EXPORT_SELECTOR } from './new/pdf-diff/pdf-output/commands/image-export-types-and-selectors';

interface ImageDiffOutputFadeProps {
  original: string;
  changed: string;
  originalHeight: number;
  originalWidth: number;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  pdfDiff?: boolean;
}

const ImageDiffOutputFade: React.FC<ImageDiffOutputFadeProps> = (props) => {
  const [range, setRange] = useState(0.5);
  const [displayHeight, setDisplayHeight] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange(parseFloat(e.target.value));
  };

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
  };

  // hack to make the image fit the container without touching the slider on top.
  const imagePadding = props.pdfDiff ? 0.95 : 0.9;

  const innerStyle = {
    ...style,
    height: style.height * imagePadding,
    width: style.width * imagePadding,
  };

  const afterStyle = {
    ...style,
    opacity: 1 - range,
    height: style.height * imagePadding,
    width: style.width * imagePadding,
  };

  return (
    <>
      <input
        type="range"
        value={range}
        min={0}
        max={1}
        step={0.01}
        onChange={handleRangeChange}
        className={cx(
          css.imageDiffOutputFadeSlider,
          props.pdfDiff && css.pdfDiffOutputFadeSlider,
          HIDE_DURING_EXPORT_SELECTOR,
        )}
      />
      <div
        className={cx(
          css.imageDiffOutputFadeContainer,
          props.pdfDiff && css.pdfDiffOutputFadeContainer,
        )}
        ref={ref}
      >
        <div
          className={css.imageDiffOutputFade}
          style={{
            ...style,
            transform: `scale(${props.imageState.zoomFactor})`,
          }}
        >
          <Draggable
            onDrag={(_ev, data) =>
              props.imageEventHandler(ImageEvent.DRAG, data)
            }
            position={{
              x:
                props.imageState.x +
                (props.pdfDiff ? 0 : (style.width - afterStyle.width) * 0.5),
              y: props.imageState.y + (style.height - innerStyle.height) * 0.5,
            }}
            scale={props.imageState.zoomFactor}
          >
            <div className={css.result} style={innerStyle}>
              <div className={css.before} style={innerStyle}>
                <span>
                  <img src={props.original} alt="before" />
                </span>
              </div>
              <div className={css.after} style={afterStyle}>
                <span>
                  <img src={props.changed} alt="after" />
                </span>
              </div>
            </div>
          </Draggable>
        </div>
      </div>
      <style jsx>{``}</style>
    </>
  );
};

export default ImageDiffOutputFade;
