import { type PdfImageDiffResult, PdfPageSide } from 'lib/compare-pdf-images';
import { PdfImageDiffOutputTypes } from 'lib/output-types';
import React from 'react';
import { type DraggableData } from 'react-draggable';

import ImageDiffOutputDifference from './image-diff-output-difference';
import ImageDiffOutputDownloadable from './image-diff-output-downloadable';
import ImageDiffOutputFade from './image-diff-output-fade';
import ImageDiffOutputSlider from './image-diff-output-slider';
import ImageDiffOutputSplit from './image-diff-output-split';
import { type ImageEvent, type ImageState } from 'types/image-diff';
import css from './pdf-diff-output-image.module.css';
import Badge from './shared/badge';
import cx from 'classnames';
import { IMAGE_PAGE_SELECTOR } from './new/pdf-diff/pdf-output/commands/image-export-types-and-selectors';
import { t } from 'lib/react-tiny-i18n';

interface PdfDiffImage {
  imageData: PdfImageDiffResult;
  pageNumber: number;
  imageType: PdfImageDiffOutputTypes;
  imageState: ImageState;
  imageEventHandler: (eventType: ImageEvent, dragData?: DraggableData) => void;
  showEqualPages: boolean;
}

const PdfDiffOutputImage: React.FC<PdfDiffImage> = (
  props,
): JSX.Element | null => {
  const isImageIdentical = (): boolean => {
    return Math.round(props.imageData.mismatchPercentage * 100000) === 0;
  };

  if (!props.showEqualPages && isImageIdentical()) {
    return null;
  }

  return (
    <div className={cx(css.pdfImageOutput, IMAGE_PAGE_SELECTOR)}>
      <div className={css.pageHeader}>
        <span>Page {props.pageNumber}</span>
        {props.imageData.pageSide === PdfPageSide.Both ? (
          <Badge style="secondary" tone={isImageIdentical() ? 'base' : 'green'}>
            {isImageIdentical()
              ? t('PdfDiff.image.noChange')
              : Math.ceil(props.imageData.mismatchPercentage).toString() +
                '% ' +
                t('PdfDiff.image.percentageChanged')}
          </Badge>
        ) : (
          <p>
            only exists on the{' '}
            {props.imageData.pageSide === PdfPageSide.Left
              ? 'original (left)'
              : 'changed (right)'}{' '}
            document
          </p>
        )}
      </div>

      {props.imageData.pageSide === PdfPageSide.Both && (
        <div className={css.output} id="displayArea">
          {props.imageType === PdfImageDiffOutputTypes.Split && (
            <>
              {props.imageData.leftImageData &&
              props.imageData.rightImageData ? (
                <ImageDiffOutputSplit
                  original={props.imageData.leftImageData}
                  changed={props.imageData.rightImageData}
                  imageState={props.imageState}
                  imageEventHandler={props.imageEventHandler}
                />
              ) : (
                <h1>Unavailable</h1>
              )}
            </>
          )}
          {props.imageType === PdfImageDiffOutputTypes.Slider && (
            <>
              {props.imageData.leftImageData &&
              props.imageData.rightImageData &&
              props.imageData.originalHeight &&
              props.imageData.originalWidth ? (
                <ImageDiffOutputSlider
                  original={props.imageData.leftImageData}
                  changed={props.imageData.rightImageData}
                  originalHeight={props.imageData.originalHeight}
                  originalWidth={props.imageData.originalWidth}
                  imageState={props.imageState}
                  imageEventHandler={props.imageEventHandler}
                  pdfDiff={true}
                />
              ) : (
                <h1>Unavailable</h1>
              )}
            </>
          )}
          {props.imageType === PdfImageDiffOutputTypes.Fade && (
            <>
              {props.imageData.leftImageData &&
              props.imageData.rightImageData &&
              props.imageData.originalHeight &&
              props.imageData.originalWidth ? (
                <ImageDiffOutputFade
                  original={props.imageData.leftImageData}
                  changed={props.imageData.rightImageData}
                  originalHeight={props.imageData.originalHeight}
                  originalWidth={props.imageData.originalWidth}
                  imageState={props.imageState}
                  imageEventHandler={props.imageEventHandler}
                  pdfDiff={true}
                />
              ) : (
                <h1>Unavailable</h1>
              )}
            </>
          )}
          {props.imageType === PdfImageDiffOutputTypes.Difference && (
            <>
              {props.imageData.leftImageData &&
              props.imageData.rightImageData &&
              props.imageData.originalHeight &&
              props.imageData.originalWidth ? (
                <ImageDiffOutputDifference
                  original={props.imageData.leftImageData}
                  changed={props.imageData.rightImageData}
                  originalHeight={props.imageData.originalHeight}
                  originalWidth={props.imageData.originalWidth}
                  imageState={props.imageState}
                  imageEventHandler={props.imageEventHandler}
                  pdfDiff={true}
                />
              ) : (
                <h1>Unavailable</h1>
              )}
            </>
          )}
          {props.imageType === PdfImageDiffOutputTypes.Highlight && (
            <>
              {props.imageData.leftImageData &&
              props.imageData.rightImageData ? (
                <ImageDiffOutputDownloadable
                  originalUrl={props.imageData.leftImageData}
                  changedUrl={props.imageData.rightImageData}
                  imageState={props.imageState}
                  imageEventHandler={props.imageEventHandler}
                  pdfDiff={true}
                  pdfUrl={props.imageData.imageDataUrl}
                />
              ) : (
                <h1>Unavailable</h1>
              )}
            </>
          )}
        </div>
      )}

      {props.imageData.pageSide !== PdfPageSide.Both && (
        <div className={css.output} id="displayArea">
          <ImageDiffOutputDownloadable
            originalUrl={props.imageData.imageDataUrl}
            changedUrl={props.imageData.imageDataUrl}
            imageState={props.imageState}
            imageEventHandler={props.imageEventHandler}
            pdfDiff={true}
            pdfUrl={props.imageData.imageDataUrl}
          />
        </div>
      )}
    </div>
  );
};

export default PdfDiffOutputImage;
