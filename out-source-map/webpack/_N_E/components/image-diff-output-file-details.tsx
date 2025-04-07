import * as React from 'react';
import { captureException } from 'lib/sentry';
import { useState } from 'react';

import ImageInputMetadata, {
  type ImageMetadataProps,
} from './image-input-metadata';

interface ImageDiffOutputFileDetailsProps {
  original: string;
  changed: string;
  originalFilename: string;
  changedFilename: string;
  originalHeight: number;
  originalWidth: number;
  originalSize: string;
  changedHeight: number;
  changedWidth: number;
  changedSize: string;
  originalArrayBuffer: ArrayBuffer;
  changedArrayBuffer: ArrayBuffer;
}

const whiteList = [
  'Bit Depth',
  'Color Type',
  'Subsampling',
  'Filter',
  'Interlace',
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'Artist',
  'BitsPerSample',
  'Make',
  'Model',
  'Orientation',
  'DateTime',
  'Saturation',
  'Sharpness',
  'Contrast',
  'ImageDescription',
  'ImageUniqueID',
] as const;

const ImageDiffOutputFileDetails: React.FC<ImageDiffOutputFileDetailsProps> = (
  props,
) => {
  const [originalImageMetadata, setOriginalImageMetadata] =
    useState<ImageMetadataProps>();
  const [changedImageMetadata, setChangedImageMetadata] =
    useState<ImageMetadataProps>();
  const getImageProperties = async (
    arrayBuffer: ArrayBuffer,
  ): Promise<ImageMetadataProps | undefined> => {
    const ExifReader = await import('exifreader');

    try {
      const tags = ExifReader.load(arrayBuffer);

      const imageProperties: ImageMetadataProps = {};
      for (const entry of whiteList) {
        if (entry in tags) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value: any = {
            description: tags[entry]!.description,
          };
          imageProperties[entry] = value;
        }
      }
      const getSanitizedAltitude = (tag: ExifReader.ValueTag) => {
        let sanitizedAltitude: string;
        const rawAlt = tag.description;
        const altitudeRounded = parseInt(rawAlt).toString();
        const whitespaceIndex = rawAlt.indexOf(' ');
        if (whitespaceIndex !== -1) {
          const unit = rawAlt.substring(whitespaceIndex);
          sanitizedAltitude = altitudeRounded + unit;
        } else {
          sanitizedAltitude = altitudeRounded;
        }
        return sanitizedAltitude;
      };
      const getSanitizedCoordinate = (tag: ExifReader.ValueTag) => {
        const coordinate = tag.description;
        let numericCoord = parseFloat(coordinate);
        numericCoord = Math.round(numericCoord * 100) / 100; // round to two dec. places
        return numericCoord.toString();
      };
      if (imageProperties.GPSAltitude) {
        imageProperties.GPSAltitude.description = getSanitizedAltitude(
          imageProperties.GPSAltitude as unknown as ExifReader.ValueTag,
        );
      }
      if (imageProperties.GPSLatitude && imageProperties.GPSLongitude) {
        imageProperties.GPSLatitude.description = getSanitizedCoordinate(
          imageProperties.GPSLatitude as unknown as ExifReader.ValueTag,
        );
        imageProperties.GPSLongitude.description = getSanitizedCoordinate(
          imageProperties.GPSLongitude as unknown as ExifReader.ValueTag,
        );
      }
      return imageProperties;
    } catch (e) {
      captureException(e);
      captureException('Not able to get image details');
    }
  };

  React.useEffect(() => {
    const getImageMetadata = async (
      isOriginal: boolean,
      filename: string,
      arrayBuffer: ArrayBuffer,
    ): Promise<ImageMetadataProps | undefined> => {
      const imageMetadata = await getImageProperties(arrayBuffer);
      const fileType: string | undefined = filename.split('.').pop();
      if (imageMetadata) {
        imageMetadata.fileType = fileType;
        return {
          fileSize: isOriginal ? props.originalSize : props.changedSize,
          height: isOriginal ? props.originalHeight : props.changedHeight,
          width: isOriginal ? props.originalWidth : props.changedWidth,
          ...imageMetadata,
        };
      }
    };

    const setImageMetadata = async () => {
      const originalImageMetadata = await getImageMetadata(
        true,
        props.originalFilename,
        props.originalArrayBuffer,
      );
      const changedImageMetadata = await getImageMetadata(
        false,
        props.changedFilename,
        props.changedArrayBuffer,
      );

      setOriginalImageMetadata(originalImageMetadata);
      setChangedImageMetadata(changedImageMetadata);
    };
    setImageMetadata();
  }, [props]);

  return (
    <div className="imageDiff-output-details">
      <div className="imageDiff-output-container">
        <div className="imageDiff-output">
          <div className="imageDiff-output__image">
            <img src={props.original} alt="Input" />
          </div>
          <div className="imageDiff-output__data">
            {originalImageMetadata && (
              <ImageInputMetadata {...originalImageMetadata} />
            )}
          </div>
        </div>
      </div>
      <div className="imageDiff-output-container">
        <div className="imageDiff-output">
          <div className="imageDiff-output__image">
            <img src={props.changed} alt="Input" />
          </div>
          <div className="imageDiff-output__data">
            {changedImageMetadata && (
              <ImageInputMetadata {...changedImageMetadata} />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .imageDiff-output-details {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
          min-height: 300px;
        }
        .imageDiff-output-container {
          width: 50%;
        }
        .imageDiff-output-container:first-child {
          border-right: solid 0.5rem var(--back-strongest);
        }
        .imageDiff-output-container:last-child {
          border-left: solid 0.5rem var(--back-strongest);
        }
        .imageDiff-output {
          height: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          color: var(--front-strongest);
          background: var(--back-strong);
        }
        .imageDiff-output__image {
          padding: 20px;
        }
        .imageDiff-output__image img {
          max-height: 200px;
          max-width: 100%;
          display: block;
          margin: 0 auto;
        }
        .imageDiff-output__data {
        }
      `}</style>
    </div>
  );
};
export default ImageDiffOutputFileDetails;
