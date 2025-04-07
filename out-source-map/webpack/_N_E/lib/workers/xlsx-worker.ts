import {
  DiffWorkBookRequest,
  LoadWorkBookRequest,
  ExcelWorkerMessageType,
  ExcelWorkerResponse,
} from 'types/xlsx-worker-types';
import { WorkBook, utils, read, WorkSheet } from 'xlsx';
import daff, { DiffSummary, TableView } from 'daff/lib/core';
import {
  WorkBookCustomProps,
  ExcelDiffStats,
  ProcessedSheetData,
} from 'types/excelDiff';
import {
  excelTransformations,
  ExcelTransformationType,
} from 'components/new/excel-diff/excel-output/excel-transformations';
import { excelLogger } from 'lib/logger';
import { ExcelDiffLevel } from 'components/new/excel-diff/excel-output/types';

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent) => {
  const { id, type, data } = event.data;

  const response: ExcelWorkerResponse = { id };

  try {
    switch (type) {
      case ExcelWorkerMessageType.LOAD_WORKBOOK:
        // TODO: Handling password protected files via error here because we weren't before.
        // We should figure out how we can programmatically unlock password protected files in the future.
        const workbook = await loadWorkBook(data);
        response.data = workbook;
        break;
      case ExcelWorkerMessageType.PROCESS_WORKBOOK:
        excelLogger.info('Processing workBook');
        const processedData = await findSheet(
          data.workBook,
          data.selectedSheet,
          'standard',
        );
        response.data = processedData;
        break;
      case ExcelWorkerMessageType.DIFF_WORKBOOK:
        const daffOutput = await loadDiff(data);
        let pointer = 0;
        while (pointer < daffOutput.diffTable.data.length) {
          const row = daffOutput.diffTable.data[pointer];
          pointer++;
          ctx.postMessage({
            id,
            type: ExcelWorkerMessageType.DIFF_ROW_DATA,
            data: row,
          });
        }
        // Complete response by sending over the metadata
        response.data = { stats: daffOutput.stats, CSVs: daffOutput.CSVs };
        break;
    }
  } catch (e) {
    response.error = (e as Error).message;
  }
  ctx.postMessage(response);
};

const convertToJSON = (sheet: WorkSheet): string[][] => {
  return utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    rawNumbers: false,
    defval: '',
  });
};

const loadWorkBook = async (data: LoadWorkBookRequest) => {
  const { file: arrayBufferData } = data;
  excelLogger.info('Loading workbook');

  const workBook: WorkBook = utils.book_new();
  // First get properties with minimal parsing
  const propsOnlyWorkbook = read(arrayBufferData, {
    type: 'buffer',
    bookProps: true,
    bookSheets: false,
  });

  // Then parse the actual data with optimized options
  const optimizedWorkbook = read(arrayBufferData, {
    type: 'buffer',
    raw: true,
  });

  const sheets = Object.keys(optimizedWorkbook.Sheets).map((name) => {
    const sheet = optimizedWorkbook.Sheets[name];

    // Copy the sheet and replace the w value with the f value if it exists
    const formulaSheet = Object.keys(sheet).reduce(
      (acc, key: string) => {
        acc[key] =
          typeof sheet[key] === 'object' ? { ...sheet[key] } : sheet[key];
        if (acc[key].w && acc[key].f) {
          acc[key].w = acc[key].f;
        }
        return acc;
      },
      {} as typeof sheet,
    );

    const standard = convertToJSON(sheet);
    const formulas = convertToJSON(formulaSheet);

    return {
      name,
      standard,
      formulas,
    };
  });

  workBook.Custprops = {
    ...(workBook.Custprops as WorkBookCustomProps),
    sheets,
  } as WorkBookCustomProps;
  workBook.SheetNames = sheets.map((sheet) => sheet.name);
  if (propsOnlyWorkbook.Props) {
    workBook.Props = propsOnlyWorkbook.Props;
  }

  return workBook;
};

const findSheet = (
  workBook: WorkBook,
  selectedSheet: string,
  dataType: ExcelDiffLevel,
  slice?: number,
): string[][] => {
  const sheetData =
    (workBook.Custprops as WorkBookCustomProps).sheets.find(
      (s) => s.name === selectedSheet,
    )?.[dataType] ?? [];
  return slice ? sheetData.slice(slice) : sheetData;
};

const makeUniqueHeaders = (headers: string[]): string[] => {
  const counts: Record<string, number> = {};
  return headers.map((header) => {
    // If header is seen for the first time, return it as is
    if (counts[header] === undefined) {
      counts[header] = 0;
      return header;
    } else {
      // Otherwise, increment count and append a suffix
      counts[header]++;
      return `${header}__DIFFCHECKER_DAFF_INDEX_${counts[header]}__`;
    }
  });
};

const processHeadersForDaff = (sheetData: string[][]): ProcessedSheetData => {
  if (sheetData.length === 0) {
    return { processedData: [], isHeadersModified: false };
  }

  const headers = sheetData[0];

  // Check for duplicates by comparing the size of a Set to the array length
  const uniqueHeadersSet = new Set(headers);
  const hasDuplicates = uniqueHeadersSet.size !== headers.length;
  excelLogger.info('hasDuplicates', hasDuplicates);

  if (!hasDuplicates) {
    return { processedData: sheetData, isHeadersModified: false };
  }

  // Generate unique headers where first occurrence is kept and all subsequent occurrences are appended with a suffix (e.g. 'Name', 'Name__DAFF_INDEX_1__', 'Name__DAFF_INDEX_2__', etc.)
  const uniqueHeaders = makeUniqueHeaders(headers);
  excelLogger.info(
    'Duplicate column names found. Modified headers:',
    uniqueHeaders,
  );

  return {
    processedData: [uniqueHeaders, ...sheetData.slice(1)],
    isHeadersModified: true,
  };
};
/**
 * Helper function to process a sheet for diffing
 * Handles slicing, transformation, and generating CSV and daff table
 */
const processSheetForDiff = async (
  workbook: WorkBook,
  sheetName: string,
  headerLineNumber: number,
  diffLevel: ExcelDiffLevel,
  transformationType: ExcelTransformationType,
): Promise<{
  csv: string;
  table: TableView;
  isHeadersModified: boolean;
}> => {
  let sheetData = findSheet(
    workbook,
    sheetName,
    diffLevel,
    headerLineNumber > 1 ? headerLineNumber - 1 : 0,
  );
  if (transformationType !== ExcelTransformationType.None) {
    sheetData = await excelTransformations[transformationType](sheetData);
  }

  // Process headers for Daff ensuring unique headers
  const { processedData, isHeadersModified } = processHeadersForDaff(sheetData);

  const [csv, table] = await Promise.all([
    getCsv(sheetData),
    getDaffTable(processedData), // will have unique headers or original headers if no duplicates found
  ]);

  return { csv, table, isHeadersModified };
};

const loadDiff = async (data: DiffWorkBookRequest) => {
  const { sides, sheetNames, headerLineNumbers, transformationType, settings } =
    data;
  const { left, right } = sides;
  if (!left || !right) {
    throw new Error('Both workbooks are required');
  }

  // Process both sides in parallel
  const [leftProcessed, rightProcessed] = await Promise.all([
    processSheetForDiff(
      left,
      sheetNames.left,
      headerLineNumbers.left,
      settings.diffLevel,
      transformationType,
    ),
    processSheetForDiff(
      right,
      sheetNames.right,
      headerLineNumbers.right,
      settings.diffLevel,
      transformationType,
    ),
  ]);

  const isHeadersModified =
    leftProcessed.isHeadersModified || rightProcessed.isHeadersModified;

  const alignment = daff
    .compareTables(leftProcessed.table, rightProcessed.table)
    .align();
  const diffData: string[][] = [];
  const diffTable = new daff.TableView(diffData);
  const flags = new daff.CompareFlags();

  flags.show_unchanged_columns = true;
  flags.never_show_order = false;
  flags.always_show_order = true;
  flags.show_unchanged = !settings.compareUnchangedRows; // Structured like this so label is 'Hide unchanged rows' instead of 'Show unchanged rows' to make all default settings false
  flags.unchanged_context = 0; // Needed in order for 'show_unchanged' to work properly
  flags.ignore_whitespace = settings.compareWhitespace;
  flags.ignore_case = settings.compareCaseChanges;

  const highlighter = new daff.TableDiff(alignment, flags);
  highlighter.hilite(diffTable);

  const summary = highlighter.getSummary();
  const stats = processStats(summary);
  excelLogger.info('Completed generating diffTable');

  // Clean up the headers in diffTable.data
  if (diffTable.data.length > 0 && isHeadersModified) {
    removeSuffixesFromHeaders(diffTable);
  }

  return {
    diffTable,
    stats,
    CSVs: { left: leftProcessed.csv, right: rightProcessed.csv },
  };
};

const getCsv = async (sheetData: string[][]): Promise<string> => {
  excelLogger.info('Convert to CSV...');
  // For cells that contain a newline \n, we replace it with \r instead.
  return sheetData
    .map((row: string[]) => {
      return row.join(',').replace(/\n/g, ' \r');
    })
    .join('\n');
};

const getDaffTable = (sheet: string[][]): Promise<TableView> => {
  excelLogger.info('Generating daff table...');
  return new Promise<TableView>((resolve) => {
    resolve(new daff.TableView(sheet));
  });
};

const processStats = (stats: DiffSummary): ExcelDiffStats => {
  const cellUpdates = Math.max(stats.row_updates, stats.col_updates);
  const added = stats.col_inserts + stats.row_inserts + cellUpdates;
  const removed = stats.col_deletes + stats.row_deletes + cellUpdates;
  const reordered = stats.col_reorders + stats.row_reorders;
  return { reordered, added, removed };
};

const removeSuffixesFromHeaders = (diffTable: daff.TableView) => {
  excelLogger.info('Cleaning up headers in diffTable');
  // First determine which row is the header row
  const headerRowNumber = diffTable.data[1][1] === '!' ? 2 : 1;

  // Clean up only the necessary rows based on headerRowNumber
  const rowsToClean = headerRowNumber === 2 ? [1, 2] : [1];

  for (const rowIndex of rowsToClean) {
    if (diffTable.data[rowIndex]) {
      const rowLength = diffTable.data[rowIndex].length;
      // Skip the first two columns as they are the row number & action columns - see Daff docs for more info
      // https://paulfitz.github.io/daff-doc/
      for (let colIndex = 2; colIndex < rowLength; colIndex++) {
        const cell = diffTable.data[rowIndex][colIndex];
        if (cell.includes('__DIFFCHECKER_DAFF_INDEX_')) {
          diffTable.data[rowIndex][colIndex] = cell.replace(
            /__DIFFCHECKER_DAFF_INDEX_\d+__/,
            '',
          );
        }
      }
    }
  }
};
