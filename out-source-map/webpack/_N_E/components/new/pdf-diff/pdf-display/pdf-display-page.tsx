import { useLayoutEffect, useMemo, useRef } from 'react';
import PDFiumImage from 'lib/pdfium/image';
import css from './pdf-display-page.module.css';
import { PDFiumChunk } from 'lib/pdfium/messages';
import PdfPageText from './pdf-page-text';

interface PdfDisplayPageProps {
  chunks: PDFiumChunk[];
  image: PDFiumImage;
}

const PdfDisplayPage: React.FC<
  React.PropsWithChildren<PdfDisplayPageProps>
> = ({ chunks, image, children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tspans = useMemo(
    () => <PdfPageText chunks={chunks} pageHeight={image.height} />,
    [chunks, image.height],
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }
    image.streamOnCanvas(canvas);
  }, [image]);

  return (
    <div className={css.page}>
      <svg
        viewBox={`0 0 ${image.width} ${image.height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {children}
        <text>{tspans}</text>
      </svg>
      <canvas
        ref={canvasRef}
        width={image.canvasWidth}
        height={image.canvasHeight}
      />
    </div>
  );
};

export default PdfDisplayPage;
