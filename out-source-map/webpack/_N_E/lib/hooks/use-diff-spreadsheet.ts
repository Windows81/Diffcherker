import { useCallback, useState } from 'react';
import type { WorkBook } from 'xlsx';
import type { FileInfo } from 'types/file-info';

export interface SpreadsheetState {
  id?: number;
  workBook?: WorkBook;
  sheetName: string;
  headerLineNumber: string;
  csv: string;
  fileInfo: FileInfo;
}

export type UseSpreadsheetReturn = {
  state: SpreadsheetState;
  clearState: () => void;
  setId: (id?: number) => void;
  setState: (newState: SpreadsheetState) => void;
  setWorkBook: (workBook?: WorkBook) => void;
  setSheetName: (sheetName: string) => void;
  setHeaderLineNumber: (headerLineNumber: string) => void;
  setCsv: (csv: string) => void;
  setFileInfo: (fileInfo: FileInfo) => void;
};

const useSpreadsheet = (
  initialState?: SpreadsheetState,
): UseSpreadsheetReturn => {
  const [id, setId] = useState<number | undefined>(initialState?.id);
  const [workBook, setWorkBook] = useState<WorkBook | undefined>(
    initialState?.workBook,
  );
  const [sheetName, setSheetName] = useState<string>(
    initialState?.sheetName ?? '',
  );
  const [headerLineNumber, setHeaderLineNumber] = useState<string>(
    initialState?.headerLineNumber ?? '1',
  );
  const [csv, setCsv] = useState<string>(initialState?.csv ?? '');
  const [fileInfo, setFileInfo] = useState<FileInfo>(
    initialState?.fileInfo ?? { filename: '', fileSize: 0 },
  );

  const state: SpreadsheetState = {
    id,
    workBook,
    sheetName,
    headerLineNumber,
    csv,
    fileInfo,
  };

  const clearState = useCallback(() => {
    setWorkBook(undefined);
    setSheetName('');
    setHeaderLineNumber('1');
    setCsv('');
    setFileInfo({ filename: '', fileSize: 0 });
    setId(undefined);
  }, []);

  const setState = useCallback((newState: SpreadsheetState) => {
    setWorkBook(newState.workBook);
    setSheetName(newState.sheetName);
    setHeaderLineNumber(newState.headerLineNumber);
    setCsv(newState.csv);
    setFileInfo(newState.fileInfo);
    setId(newState.id);
  }, []);

  return {
    state,
    clearState,
    setId,
    setState,
    setWorkBook,
    setSheetName,
    setHeaderLineNumber,
    setCsv,
    setFileInfo,
  };
};

export default useSpreadsheet;
