import * as React from 'react';
import { ImageDiffOutputTypes } from 'lib/output-types';
import { type DraggableData } from 'react-draggable';

import { type ImageEvent, type ImageState } from '../types/image-diff';
import ImageDiffOutputDifference from './image-diff-output-difference';
import ImageDiffOutputDownloadable from './image-diff-output-downloadable';
import ImageDiffOutputFade from './image-diff-output-fade';
import ImageDiffOutputFileDetails from './image-diff-output-file-details';
import ImageDiffOutputSlider from './image-diff-output-slider';
import ImageDiffOutputSplit from './image-diff-output-split';

interface ImageDiffOutputProps {
  original: string;
  changed: string;
  originalArrayBuffer?: ArrayBuffer;
  changedArrayBuffer?: ArrayBuffer;
  originalFilename: string;
  changedFilename: string;
  imageHeight: number;
  imageWidth: number;
  originalHeight: number;
  originalWidth: number;
  originalSize: string;
  changedHeight: number;
  changedWidth: number;
  changedSize: string;
  type: ImageDiffOutputTypes;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
}

const ImageDiffOutput: React.FC<ImageDiffOutputProps> = (props) => {
  return (
    <>
      {props.type === ImageDiffOutputTypes.Split && (
        <ImageDiffOutputSplit
          original={props.original}
          changed={props.changed}
          imageState={props.imageState}
          imageEventHandler={props.imageEventHandler}
        />
      )}
      {props.type === ImageDiffOutputTypes.Slider && (
        <ImageDiffOutputSlider
          original={props.original}
          changed={props.changed}
          originalHeight={props.imageHeight}
          originalWidth={props.imageWidth}
          imageState={props.imageState}
          imageEventHandler={props.imageEventHandler}
        />
      )}
      {props.type === ImageDiffOutputTypes.Fade && (
        <ImageDiffOutputFade
          original={props.original}
          changed={props.changed}
          originalHeight={props.imageHeight}
          originalWidth={props.imageWidth}
          imageState={props.imageState}
          imageEventHandler={props.imageEventHandler}
        />
      )}
      {props.type === ImageDiffOutputTypes.Difference && (
        <ImageDiffOutputDifference
          original={props.original}
          changed={props.changed}
          originalHeight={props.imageHeight}
          originalWidth={props.imageWidth}
          imageState={props.imageState}
          imageEventHandler={props.imageEventHandler}
        />
      )}
      {props.type === ImageDiffOutputTypes.Highlight && (
        <ImageDiffOutputDownloadable
          originalUrl={props.original}
          changedUrl={props.changed}
          imageState={props.imageState}
          imageEventHandler={props.imageEventHandler}
          originalHeight={props.originalHeight}
          originalWidth={props.originalWidth}
        />
      )}
      {props.originalArrayBuffer &&
        props.changedArrayBuffer &&
        props.type === ImageDiffOutputTypes['File details'] && (
          <ImageDiffOutputFileDetails
            original={props.original}
            changed={props.changed}
            originalFilename={props.originalFilename}
            changedFilename={props.changedFilename}
            originalHeight={props.originalHeight}
            originalWidth={props.originalWidth}
            originalSize={props.originalSize}
            changedHeight={props.changedHeight}
            changedWidth={props.changedWidth}
            changedSize={props.changedSize}
            originalArrayBuffer={props.originalArrayBuffer}
            changedArrayBuffer={props.changedArrayBuffer}
          />
        )}
    </>
  );
};
export default ImageDiffOutput;
