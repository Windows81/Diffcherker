import css from 'components/new/pdf-diff/file-metadata.module.css';
import formatFileSize from 'lib/format-file-size';
import { formatDateObject } from 'lib/format-date-object';

interface ExcelMetadata {
  ModifiedDate?: Date;
  Size?: number;
  Type?: string;
  Name?: string;
  LastAuthor?: string;
  Author?: string;
  CreatedDate?: Date;
  AppVersion?: string;
  Application?: string;
  DocSecurity?: string;
  HyperlinksChanged?: boolean;
  SharedDoc?: boolean;
  Worksheets?: number;
  SheetNames?: string[];
}

interface ExcelMetadataProps {
  left: ExcelMetadata;
  right: ExcelMetadata;
}

const ExcelMetadata: React.FC<ExcelMetadataProps> = ({ left, right }) => {
  return (
    <div className={css.container}>
      <ExcelMetadataSide {...left} />
      <ExcelMetadataSide {...right} />
    </div>
  );
};

const ExcelMetadataSide: React.FC<ExcelMetadata> = ({
  ModifiedDate: modifiedDate,
  Size: size,
  Type: type,
  Name: name,
  LastAuthor: lastAuthor,
  Author: author,
  CreatedDate: createdDate,
  AppVersion: appVersion,
  Application: application,
  HyperlinksChanged: hyperlinksChanged,
  SharedDoc: sharedDoc,
  Worksheets: worksheets,
  SheetNames: sheetNames,
}) => {
  return (
    <ul className={css.metadata}>
      {author && author.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Author</span>
          <span className={css.fieldValue}>{author}</span>
        </li>
      )}
      {size && (
        <li>
          <span className={css.fieldKey}>Size</span>
          <span className={css.fieldValue}>{formatFileSize(size)}</span>
        </li>
      )}
      {type && (
        <li>
          <span className={css.fieldKey}>Type</span>
          <span className={css.fieldValue}>{type}</span>
        </li>
      )}
      {name && (
        <li>
          <span className={css.fieldKey}>Name</span>
          <span className={css.fieldValue}>{name}</span>
        </li>
      )}
      {modifiedDate && (
        <li>
          <span className={css.fieldKey}>Modification Date</span>
          <span className={css.fieldValue}>
            {formatDateObject(modifiedDate)}
          </span>
        </li>
      )}
      {lastAuthor && lastAuthor.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Last Author</span>
          <span className={css.fieldValue}>{lastAuthor}</span>
        </li>
      )}
      {createdDate && (
        <li>
          <span className={css.fieldKey}>Date Created</span>
          <span className={css.fieldValue}>
            {formatDateObject(createdDate)}
          </span>
        </li>
      )}
      {appVersion && (
        <li>
          <span className={css.fieldKey}>Excel Format Version</span>
          <span className={css.fieldValue}>{appVersion}</span>
        </li>
      )}
      {application && application.trim() !== '' && (
        <li>
          <span className={css.fieldKey}>Application</span>
          <span className={css.fieldValue}>{application}</span>
        </li>
      )}
      {hyperlinksChanged !== undefined && (
        <li>
          <span className={css.fieldKey}>Hyperlinks Changed</span>
          <span className={css.fieldValue}>
            {hyperlinksChanged ? 'Yes' : 'No'}
          </span>
        </li>
      )}
      {sharedDoc !== undefined && (
        <li>
          <span className={css.fieldKey}>Shared Document</span>
          <span className={css.fieldValue}>{sharedDoc ? 'Yes' : 'No'}</span>
        </li>
      )}
      {worksheets !== undefined && (
        <li>
          <span className={css.fieldKey}>Worksheets</span>
          <span className={css.fieldValue}>{worksheets}</span>
        </li>
      )}
      {sheetNames && sheetNames.length > 0 && (
        <li>
          <span className={css.fieldKey}>Sheet Names</span>
          <span className={css.fieldValue}>{sheetNames.join(', ')}</span>
        </li>
      )}
    </ul>
  );
};

export default ExcelMetadata;
