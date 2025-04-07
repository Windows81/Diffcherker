import { WorkBook } from 'xlsx';
import { ExcelDiffStats } from './excelDiff';
import { ExcelTransformationType } from '../components/new/excel-diff/excel-output/excel-transformations';
import { ExcelDiffOutputSettingsObject } from 'components/new/excel-diff/excel-output/types';
import { ExcelDiffOutputTypes } from 'lib/output-types';

export type ExcelWorker = Omit<Worker, 'postMessage'> & {
  postMessage(message: ExcelWorkerMessage, transfer?: Transferable[]): void;
};

export enum ExcelWorkerMessageType {
  LOAD_WORKBOOK = 'loadWorkBook',
  PROCESS_WORKBOOK = 'processWorkBook',
  DIFF_WORKBOOK = 'diffWorkBook',
  DIFF_ROW_DATA = 'diffRowData',
  ERROR = 'error',
}

export interface ExcelWorkerMessage {
  id: number;
  type: ExcelWorkerMessageType;
}

export interface ProcessWorkBookRequest extends ExcelWorkerMessage {
  workBook: WorkBook;
  selectedSheet: string;
}

export type ExcelWorkerResponse = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
};

export interface LoadWorkBookRequest extends ExcelWorkerMessage {
  file: ArrayBuffer;
  fileType?: string;
}

export interface DiffWorkBookRequest extends ExcelWorkerMessage {
  sides: Record<'left' | 'right', WorkBook | undefined>;
  sheetNames: Record<'left' | 'right', string>;
  headerLineNumbers: Record<'left' | 'right', number>;
  transformationType: ExcelTransformationType;
  settings: ExcelDiffOutputSettingsObject[ExcelDiffOutputTypes.Table];
}

export interface LoadWorkBookResponse extends ExcelWorkerMessage {
  workBook: WorkBook;
}

export interface ProcessWorkBookResponse extends ExcelWorkerMessage {
  data: string[][];
}

export interface DiffWorkBookResponse extends ExcelWorkerMessage {
  stats: ExcelDiffStats;
  diffResult: string[][];
  CSVs: {
    left: string;
    right: string;
  };
}

export interface DiffRowDataResponse extends ExcelWorkerMessage {
  data: string[];
}

export interface ErrorResponse extends ExcelWorkerMessage {
  message: string;
}
