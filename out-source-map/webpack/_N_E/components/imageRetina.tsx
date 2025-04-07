import * as React from 'react';

interface ImageRetinaProps {
  src?: string;
  format?: string;
  alt?: string;
  display?: string;
  verticalAlign?: string;
  height?: number;
  width?: number;
}

const ImageRetina: React.FC<ImageRetinaProps> = ({
  src,
  format = 'png',
  alt,
  display = 'block',
  verticalAlign = 'middle',
  height,
  width,
}) => {
  return (
    <div className="img-container">
      <img
        height={height}
        width={width}
        src={`/static/images/${src}.${format}`}
        srcSet={`/static/images/${src}@2x.${format} 2x, /static/images/${src}.${format} 1x`}
        alt={alt}
      />
      <style jsx>{`
        .img-container {
          display: ${display};
          vertical-align: ${verticalAlign};
          margin: 0;
        }
        img {
          max-width: 100%;
          display: ${display};
          margin: 0;
          filter: brightness(var(--images-brightness));
        }
      `}</style>
    </div>
  );
};
export default ImageRetina;
