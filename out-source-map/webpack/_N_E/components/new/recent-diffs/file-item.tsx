import { DiffInputType } from 'types/diff-input-type';
import css from './file-item.module.css';
import ExcelSVGSmall from '../../../static/images/new/excel-small.svg';
import ImageSVGSmall from '../../../static/images/new/image-small.svg';
import PDFSVGSmall from '../../../static/images/new/pdf-small.svg';
import TextSVGSmall from '../../../static/images/new/text-small.svg';
import FoldersSVGSmall from '../../../static/images/new/folder-small.svg';
import WordSVGSmall from '../../../static/images/new/word-small.svg';

import ExcelSVG from '../../../static/images/new/excel.svg';
import ImageSVG from '../../../static/images/new/image.svg';
import PDFSVG from '../../../static/images/new/pdf.svg';
import TextSVG from '../../../static/images/new/text.svg';
import FoldersSVG from '../../../static/images/new/folder.svg';
import WordSVG from '../../../static/images/new/word.svg';

import cx from 'classnames';

const FileIcons = {
  Text: {
    default: <TextSVG />,
    small: <TextSVGSmall />,
  },
  PDF: {
    default: <PDFSVG />,
    small: <PDFSVGSmall />,
  },
  Word: {
    default: <WordSVG />,
    small: <WordSVGSmall />,
  },
  Image: {
    default: <ImageSVG />,
    small: <ImageSVGSmall />,
  },
  Excel: {
    default: <ExcelSVG />,
    small: <ExcelSVGSmall />,
  },
  Folder: {
    default: <FoldersSVG />,
    small: <FoldersSVGSmall />,
  },
} as const;

interface FileItemProps {
  name: string;
  filePath: string;
  diffType: DiffInputType;
  size?: 'default' | 'small';
  subheader?: string | boolean;
}

const FileItem = ({
  name,
  filePath,
  diffType,
  size = 'default',
  subheader,
}: FileItemProps) => {
  const isTesting = filePath.substring(0, 9) === '[TESTING]';

  const isEmptyName = name.length === 0;
  const subHeader = subheader || filePath.replace(name, '');

  return (
    <div className={cx(css.fileItem, css[size])}>
      {getIcon(name, diffType, size)}
      <div className={cx(css.content, isEmptyName && css.emptyName)}>
        <h1>{isEmptyName ? '[empty text]' : name}</h1>
        <h2>
          {isTesting
            ? `Test ${diffType[0].toUpperCase() + diffType.slice(1)} diff`
            : subHeader}
        </h2>
      </div>
    </div>
  );
};

const getIcon = (
  name: string,
  diffType: DiffInputType,
  size: 'default' | 'small',
) => {
  switch (diffType) {
    case DiffInputType.PDF:
      const icon = isWordFile(name) ? 'Word' : 'PDF';
      return FileIcons[icon][size];
    case DiffInputType.IMAGE:
      return FileIcons['Image'][size];
    case DiffInputType.EXCEL:
      return FileIcons['Excel'][size];
    case DiffInputType.FOLDER:
      return FileIcons['Folder'][size];
    case DiffInputType.TEXT:
    default:
      return FileIcons['Text'][size];
  }
};

const isWordFile = (name: string) => {
  return (
    name.toLowerCase().endsWith('.docx') || name.toLowerCase().endsWith('.doc')
  );
};

export default FileItem;
