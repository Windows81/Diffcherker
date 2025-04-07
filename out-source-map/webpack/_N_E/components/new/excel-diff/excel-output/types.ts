import { ExcelDiffOutputTypes } from 'lib/output-types';

export type ExcelDiffLevel = 'standard' | 'formulas';

export const defaultExcelDiffOutputSettings: ExcelDiffOutputSettingsObject = {
  [ExcelDiffOutputTypes.Table]: {
    diffLevel: 'standard',
    compareWhitespace: false,
    compareCaseChanges: false,
    compareUnchangedRows: false,
  },
};

export type ExcelDiffOutputSettingsObject = {
  [ExcelDiffOutputTypes.Table]: {
    diffLevel: ExcelDiffLevel;
    compareWhitespace: boolean;
    compareCaseChanges: boolean;
    compareUnchangedRows: boolean;
  };
};
