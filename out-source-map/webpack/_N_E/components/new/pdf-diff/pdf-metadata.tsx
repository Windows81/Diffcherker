import css from './file-metadata.module.css';
import { PDFiumMetadataResponse } from 'lib/pdfium/messages';

const getPdfDate = (dateString: string): string => {
  dateString = dateString.replace('D:', '');
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6));
  const day = parseInt(dateString.substring(6, 8));
  const hour = parseInt(dateString.substring(8, 10));
  const minute = parseInt(dateString.substring(10, 12));
  const seconds = parseInt(dateString.substring(12, 14));
  const creationDate = new Date(
    year,
    month - 1, // month is 0-indexed
    day,
    hour,
    minute,
    seconds,
  );
  return (
    creationDate.toLocaleDateString() +
    ' ' +
    creationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

interface PdfMetadataProps {
  left: PDFiumMetadataResponse;
  right: PDFiumMetadataResponse;
}

const PdfMetadata: React.FC<PdfMetadataProps> = ({ left, right }) => {
  return (
    <div className={css.container}>
      <PdfMetadataSide {...left} />
      <PdfMetadataSide {...right} />
    </div>
  );
};

const PdfMetadataSide: React.FC<PDFiumMetadataResponse> = ({
  title,
  author,
  producer,
  creationDate,
  modifiedDate,
  formatVersion,
  isLinearized,
  isAcroFormPresent,
  isXFAPresent,
  isCollectionPresent,
}) => {
  return (
    <ul className={css.metadata}>
      {title && title.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Title</span>
          <span className={css.fieldValue}>{title}</span>
        </li>
      )}
      {author && author.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Author</span>
          <span className={css.fieldValue}>{author}</span>
        </li>
      )}
      {creationDate && creationDate.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Date Created</span>
          <span className={css.fieldValue}>{getPdfDate(creationDate)}</span>
        </li>
      )}
      {formatVersion && formatVersion.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>PDF Format Version</span>
          <span className={css.fieldValue}>{formatVersion}</span>
        </li>
      )}
      {modifiedDate && modifiedDate.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Modification Date</span>
          <span className={css.fieldValue}>{getPdfDate(modifiedDate)}</span>
        </li>
      )}
      {producer && producer.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Producer</span>
          <span className={css.fieldValue}>{producer}</span>
        </li>
      )}
      {isAcroFormPresent !== undefined && (
        <li>
          <span className={css.fieldKey}>AcroForms Present</span>
          <span className={css.fieldValue}>
            {isAcroFormPresent ? 'Yes' : 'No'}
          </span>
        </li>
      )}
      {isLinearized !== undefined && (
        <li>
          <span className={css.fieldKey}>Linearized</span>
          <span className={css.fieldValue}>{isLinearized ? 'Yes' : 'No'}</span>
        </li>
      )}
      {isXFAPresent !== undefined && (
        <li>
          <span className={css.fieldKey}>XFA Present</span>
          <span className={css.fieldValue}>{isXFAPresent ? 'Yes' : 'No'}</span>
        </li>
      )}
      {isCollectionPresent !== undefined && (
        <li>
          <span className={css.fieldKey}>Collections Present</span>
          <span className={css.fieldValue}>
            {isCollectionPresent ? 'Yes' : 'No'}
          </span>
        </li>
      )}
    </ul>
  );
};

export default PdfMetadata;
