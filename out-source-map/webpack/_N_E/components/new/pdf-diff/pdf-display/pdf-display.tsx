import css from './pdf-display.module.css';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import PdfDisplayPage from './pdf-display-page';

interface PdfDisplayProps {
  content: PDFiumDocumentContent;
}

const PdfDisplay: React.FC<PdfDisplayProps> = ({ content }) => {
  return (
    <div className={css.pages}>
      {content.images.map((image, i) => (
        <PdfDisplayPage key={i} image={image} chunks={content.chunks[i]} />
      ))}
    </div>
  );
};

export default PdfDisplay;
