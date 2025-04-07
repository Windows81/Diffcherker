export interface NewOutputType<T extends string> {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  name: T;
}

export interface OutputType<T extends string> {
  icon: JSX.Element;
  name: T;
}

export interface DiffTypeDropdownOutputType<T extends string> {
  label: string;
  value: T;
  description?: string;
  image?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export enum ExcelDiffOutputTypes {
  'Table' = 'Table',
  'Text' = 'Text',
  'File details' = 'File details',
}

export enum PdfDiffOutputTypes {
  'Text' = 'Plain text',
  'Image' = 'Image',
  'File details' = 'File details',
  'RichText' = 'Rich text',
  'OCR' = 'OCR text',
  'Redline' = 'Redline',
}

export enum PdfImageDiffOutputTypes {
  'Split' = 'Split',
  'Slider' = 'Slider',
  'Fade' = 'Fade',
  'Difference' = 'Difference',
  'Highlight' = 'Highlight',
}

export enum ImageDiffOutputTypes {
  'Split' = 'Split',
  'Slider' = 'Slider',
  'Fade' = 'Fade',
  'Difference' = 'Difference',
  'Highlight' = 'Highlight',
  'File details' = 'File details',
}
