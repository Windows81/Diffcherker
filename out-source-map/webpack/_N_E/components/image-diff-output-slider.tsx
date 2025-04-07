import Draggable, { type DraggableData } from 'react-draggable';

import { ImageEvent, type ImageState } from '../types/image-diff';
import { useEffect, useRef, useState } from 'react';
import calculateDisplayArea from 'lib/calculate-display-area';
import cx from 'classnames';
import { HIDE_DURING_EXPORT_SELECTOR } from './new/pdf-diff/pdf-output/commands/image-export-types-and-selectors';

interface ImageDiffOutputSliderProps {
  original: string;
  changed: string;
  originalHeight: number;
  originalWidth: number;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  pdfDiff?: boolean;
}

const ImageDiffOutputSlider: React.FC<ImageDiffOutputSliderProps> = (props) => {
  const [range, setRange] = useState(0.5);
  const [displayHeight, setDisplayHeight] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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

  const handleSliderWithDrag = (eventType: string): void => {
    if (eventType === 'mousedown') {
      setIsDragging(false);
    } else if (eventType === 'mouseup') {
      setIsDragging(true);
    }
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

  const beforeStyle = {
    ...style,
    height: style.height * 0.95,
    width: style.width * 0.95,
  };
  const afterStyle = {
    ...style,
    height: style.height * 0.95,
    width: style.width * 0.95,
  };
  const sliderStyle = {
    height: style.height * 0.95,
    width: style.width * 0.95 * (1 - range),
  };

  return (
    <div ref={ref} className="imageDiff-output-slider-content-size">
      <div className="imageDiff-output-slider" style={style}>
        <div className="imageDiff-output-slider-container">
          <Draggable
            onDrag={(_ev, data) =>
              props.imageEventHandler(ImageEvent.DRAG, data)
            }
            position={{
              x:
                props.imageState.x +
                (props.pdfDiff ? 0 : (style.width - afterStyle.width) * 0.5),
              y: props.imageState.y + (style.height - afterStyle.height) * 0.5,
            }}
            disabled={!isDragging}
            scale={props.imageState.zoomFactor}
          >
            <div className="result" style={beforeStyle}>
              <input
                onMouseDown={(ev) => {
                  ev.stopPropagation();
                  handleSliderWithDrag('mousedown');
                }}
                onMouseUp={(ev) => {
                  ev.stopPropagation();
                  handleSliderWithDrag('mouseup');
                }}
                className={cx('sliderInput', HIDE_DURING_EXPORT_SELECTOR)}
                type="range"
                value={range}
                min={0}
                max={1}
                step={0.01}
                onChange={handleRangeChange}
              />
              <div className="before" style={beforeStyle}>
                <img src={props.original} alt="original" />
              </div>
              <div className="slider" style={sliderStyle}>
                <div className="after" style={afterStyle}>
                  <img src={props.changed} alt="changed" />
                </div>
              </div>
            </div>
          </Draggable>
        </div>
      </div>

      <style jsx>{`
        .imageDiff-output-slider-content-size {
          width: 100%;
          height: 100%;
        }

        .imageDiff-output-slider-container {
          height: 100%;
          width: 100%;
          display: flex;
          transform: scale(${props.imageState.zoomFactor});
        }
        .imageDiff-output-slider {
          display: block;
          margin: auto;
          position: relative;
        }
        .sliderInput {
          position: absolute;
          top: 50%;
          left: ${(1 / props.imageState.zoomFactor) * -18 + 'px'};
          width: calc(100% + ${(1 / props.imageState.zoomFactor) * 36 + 'px'});
          z-index: 10;
          cursor: pointer;
        }
        .result {
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEX5+fn///8pDrwNAAAAFElEQVQI12NgsP/AQAz+f4CBGAwAJIIdTTn0+w0AAAAASUVORK5CYII=');
          margin: 0px auto;
          position: absolute;
          cursor: grab;
          height: 95%;
        }
        .result:active {
          cursor: grabbing;
        }
        .slider {
          border-left: ${1 / props.imageState.zoomFactor + 'px'} solid
            var(--theme-colors-background-base-tertiary-active);
          margin: 0;
          overflow: hidden;
          position: absolute;
          right: 0;
        }
        .before,
        .after {
          position: absolute;
          right: 0;
          height: 95%;
        }
        .before img,
        .after img {
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        input[type='range'] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          width: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          background: url('/static/images/sliderIcon.svg');
          background-size: cover;
          background-position: center;
          cursor: pointer;
          margin-top: -16px;
        }
        input[type='range']::-moz-range-thumb {
          border: 0px;
          height: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          width: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          background: url('/static/images/sliderIcon.svg') transparent;
          background-size: cover;
          background-position: center;
          cursor: pointer;
        }
        input[type='range']::-ms-thumb {
          height: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          width: ${(1 / props.imageState.zoomFactor) * 34 + 'px'};
          background: url('/static/images/sliderIcon.svg');
          background-size: cover;
          background-position: center;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ImageDiffOutputSlider;
