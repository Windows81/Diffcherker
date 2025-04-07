import * as React from 'react';
import Draggable, { type DraggableData } from 'react-draggable';

import { ImageEvent, type ImageState } from '../types/image-diff';

interface ImageDiffOutputSplitProps {
  original: string;
  changed: string;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
}

const ImageDiffOutputSplit: React.FC<ImageDiffOutputSplitProps> = (props) => {
  return (
    <div className="imageDiff-output">
      <div className="imageDiff-output-split">
        <div className="imageDiff-output-container">
          <div className="imageDiff-output-before">
            <Draggable
              onDrag={(_ev, data) =>
                props.imageEventHandler(ImageEvent.DRAG, data)
              }
              position={{ x: props.imageState.x, y: props.imageState.y }}
              scale={props.imageState.zoomFactor}
            >
              <div className="before">
                <img className="before-img" src={props.original} alt="Input" />
              </div>
            </Draggable>
          </div>
        </div>
        <div className="imageDiff-output-container">
          <div className="imageDiff-output-after">
            <Draggable
              onDrag={(_ev, data) =>
                props.imageEventHandler(ImageEvent.DRAG, data)
              }
              position={{ x: props.imageState.x, y: props.imageState.y }}
              scale={props.imageState.zoomFactor}
            >
              <span className="after">
                <img className="after-img" src={props.changed} alt="Input" />
              </span>
            </Draggable>
          </div>
        </div>
      </div>
      <style jsx>{`
        .imageDiff-output-before,
        .imageDiff-output-after {
          display: flex;
          flex-direction: column;
        }
        .imageDiff-output-split {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
          min-height: 300px;
          gap: 28px;
        }
        .imageDiff-output-container {
          overflow: hidden;
          width: 50%;
        }
        .imageDiff-output-container:first-child {
          border-right: solid 0.5rem var(--back-strong);
        }
        .imageDiff-output-container:last-child {
          border-left: solid 0.5rem var(--back-strong);
        }
        .imageDiff-output-before,
        .imageDiff-output-after {
          transform: scale(${props.imageState.zoomFactor});
          height: 100%;
          position: relative;
          display: flex;
          color: var(--front-strongest);
          background: var(--back-strong);
        }
        .before-img,
        .after-img {
          max-width: 100%;
          max-height: 100%;
          pointer-events: none;
          -webkit-user-drag: none;
        }
        .before,
        .after {
          margin: 0px auto;
          cursor: grab;
        }
        .before:active,
        .after:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};
export default ImageDiffOutputSplit;
