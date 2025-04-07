import { useLayoutEffect, useRef } from 'react';
import PDFiumDocument from 'lib/pdfium/document';
import css from './pdf-thumbnail.module.css';
import cx from 'classnames';

interface PdfThumbnailProps {
  document?: PDFiumDocument;
  url?: string;
  isEditing: boolean;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  document,
  url,
  isEditing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !document) {
      return;
    }
    document.thumbnail.placeOnCanvas(canvas);
  }, [document]);

  return (
    <div className={css.thumbnail}>
      {document ? (
        <canvas
          ref={canvasRef}
          width={document.thumbnail.canvasWidth}
          height={document.thumbnail.canvasHeight}
        />
      ) : (
        <img
          src={url ?? 'unavailable-thumbnail.png'}
          className={cx({
            // when user is in edit header, image is squished and styling has to be handled differently
            [css.shortImage]: isEditing,
          })}
        />
      )}
    </div>
  );
};

export default PdfThumbnail;
