import * as React from 'react';
import { breakpoints, text } from 'css/variables';
import { type FileTags, type PngFileTags, type Tags } from 'exifreader';

export interface ImageMetadataProps
  extends Partial<Tags & PngFileTags & FileTags> {
  height?: number;
  width?: number;
  fileType?: string;
  fileSize?: string;
}

const ImageMetadata: React.FC<ImageMetadataProps> = (
  props: ImageMetadataProps,
): JSX.Element | null => {
  if (props.height && props.width && props.fileSize) {
    const dpi = 96 * window.devicePixelRatio;
    const heightInches = props.height / dpi;
    const widthInches = props.width / dpi;
    const vertDpi = Math.round(props.width / widthInches);
    const horizDpi = Math.round(props.height / heightInches);
    const imgFileType =
      props.fileType !== undefined ? props.fileType.toUpperCase() : 'unknown';
    return (
      <div>
        <ul className="file-meta">
          <li className="file-meta-item">
            <div className="file-meta-item__label">File type</div>
            {imgFileType}
          </li>
          <li className="file-meta-item">
            <div className="file-meta-item__label">Size</div>
            {props.fileSize}
          </li>
          <li className="file-meta-item">
            <div className="file-meta-item__label">Height</div>
            {props.height}px
          </li>
          <li className="file-meta-item">
            <div className="file-meta-item__label">Width</div>
            {props.width}px
          </li>
          <li className="file-meta-item">
            <div className="file-meta-item__label">Vertical resolution</div>
            {horizDpi} dpi
          </li>
          <li className="file-meta-item">
            <div className="file-meta-item__label">Horizontal resolution</div>
            {vertDpi} dpi
          </li>
          {props['Bit Depth'] && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Depth</div>
              {props['Bit Depth'].description}-bit
            </li>
          )}
          {props['Color Type'] && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Format</div>
              {props['Color Type'].description}
            </li>
          )}
          {props.Subsampling && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Subsampling</div>
              {props.Subsampling.description}
            </li>
          )}
          {props.Filter && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Filter</div>
              {props.Filter.description}
            </li>
          )}
          {props.Interlace && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Interlace</div>
              {props.Interlace.description}
            </li>
          )}
          {props.GPSLatitude && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Latitude</div>
              {props.GPSLatitude.description}
            </li>
          )}
          {props.GPSLongitude && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Longitude</div>
              {props.GPSLongitude.description}
            </li>
          )}
          {props.GPSAltitude && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Altitude</div>
              {props.GPSAltitude.description}
            </li>
          )}
          {props.Artist && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Photographer</div>
              {props.Artist.description}
            </li>
          )}
          {props.BitsPerSample && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Bits per sample</div>
              {props.BitsPerSample.description}
            </li>
          )}
          {props.Make && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Make</div>
              {props.Make.description}
            </li>
          )}
          {props.Model && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Model</div>
              {props.Model.description}
            </li>
          )}
          {props.Orientation && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Orientation</div>
              {props.Orientation.description}
            </li>
          )}
          {props.DateTime && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Date and time</div>
              {props.DateTime.description}
            </li>
          )}
          {props.Saturation && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Saturation</div>
              {props.Saturation.description}
            </li>
          )}
          {props.Sharpness && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Sharpness</div>
              {props.Sharpness.description}
            </li>
          )}
          {props.Contrast && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Contrast</div>
              {props.Contrast.description}
            </li>
          )}
          {props.ImageDescription && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Image description</div>
              {props.ImageDescription.description}
            </li>
          )}
          {props.ImageUniqueID && (
            <li className="file-meta-item">
              <div className="file-meta-item__label">Image unique id</div>
              {props.ImageUniqueID.description}
            </li>
          )}
        </ul>
        <style jsx>{`
          .file-meta {
            display: grid;
            grid-gap: 20px;
            grid-template-columns: 1fr 1fr;

            padding: 20px;
          }

          .file-meta-item {
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: 1px solid var(--theme-colors-border-base-secondary);
            padding-bottom: 2px;
            font-size: ${text.label.small.size};
          }
          .file-meta-item__label {
            font-weight: ${text.label.bold.weight};
            margin-right: auto;
          }
          @media (max-width: ${breakpoints.web.small}) {
            .file-meta {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }
  return null;
};
export default ImageMetadata;
