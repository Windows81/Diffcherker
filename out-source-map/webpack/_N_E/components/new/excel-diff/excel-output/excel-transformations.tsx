import { sortRows } from './commands/sort-rows';
import { sortColumns } from './commands/sort-columns';
import { normalizeDatesUS, normalizeDatesEU } from './commands/normalize-dates';
import { DiffFeature } from 'lib/diff-features';

export enum ExcelTransformationType {
  None = 'none',
  SortRows = 'sortRows',
  SortColumns = 'sortColumns',
  NormalizeDatesUS = 'normalizeDatesUS',
  NormalizeDatesEU = 'normalizeDatesEU',
}

export const excelTransformations: Record<
  ExcelTransformationType,
  (table: string[][]) => Promise<string[][]> | string[][]
> = {
  [ExcelTransformationType.None]: (table) => table,
  [ExcelTransformationType.SortRows]: sortRows,
  [ExcelTransformationType.SortColumns]: sortColumns,
  [ExcelTransformationType.NormalizeDatesUS]: normalizeDatesUS,
  [ExcelTransformationType.NormalizeDatesEU]: normalizeDatesEU,
};

export const excelTransformationTypeToDiffFeatureMap: Partial<
  Record<ExcelTransformationType, DiffFeature>
> = {
  [ExcelTransformationType.SortRows]: DiffFeature.EXCEL_SORT_ROWS,
  [ExcelTransformationType.SortColumns]: DiffFeature.EXCEL_SORT_COLUMNS,
  [ExcelTransformationType.NormalizeDatesUS]:
    DiffFeature.EXCEL_NORMALIZE_DATES_US,
  [ExcelTransformationType.NormalizeDatesEU]:
    DiffFeature.EXCEL_NORMALIZE_DATES_EU,
};
