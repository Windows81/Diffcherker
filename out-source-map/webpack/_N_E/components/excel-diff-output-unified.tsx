import {
  Cell,
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Table,
  Header,
  useReactTable,
} from '@tanstack/react-table';
import css from './excel-diff-output-unified.module.css';
import { ItemProps, Virtuoso } from 'react-virtuoso';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import cx from 'classnames';
import usePrevious from 'lib/hooks/use-previous';
import { getCssVariableHex } from 'lib/get-css-variables';
import type { Cell as ExcelCell } from 'exceljs';
import { usePdfIsExporting } from 'lib/state/pdfExport';

export interface ExportToExcelRef {
  exportToExcel: () => void;
}

interface ExcelDiffOutputUnifiedProps {
  diffTable: string[][];
  maxLines: number;
}

enum BackgroundStates {
  Inserted = 'inserted',
  Removed = 'removed',
  Reordered = 'reordered',
  Unchanged = 'unchanged',
  CellDiff = 'celldiff', // only used for header row
}

const backgroundColor: Record<BackgroundStates, string> = {
  [BackgroundStates.Inserted]: '',
  [BackgroundStates.Removed]: '',
  [BackgroundStates.Reordered]: '',
  [BackgroundStates.Unchanged]: '',
  [BackgroundStates.CellDiff]: '',
};

const textColor: Record<BackgroundStates, string> = {
  [BackgroundStates.Inserted]: '',
  [BackgroundStates.Removed]: '',
  [BackgroundStates.Reordered]: '',
  [BackgroundStates.Unchanged]: '',
  [BackgroundStates.CellDiff]: '',
};

function getLineNumber(rawString: string, side: 'left' | 'right') {
  const rawNum = rawString.split(':')[side === 'left' ? 0 : 1];
  if (rawNum === '-') {
    return '';
  } else {
    return (Number(rawNum) + 1).toString();
  }
}

function colDef(headerRow: string[], lineNumberCellWidth: number) {
  const columnHelper = createColumnHelper<string[]>();
  const col = [
    columnHelper.accessor((row) => getLineNumber(row?.[0], 'left'), {
      id: 'leftLineNumber',
      header: '1',
      size: lineNumberCellWidth,
      minSize: 17, // 9 (font-width is about 9px) * 1 (minimum 1 digit) + 8 (padding),
      enableResizing: false,
    }),
    columnHelper.accessor((row) => getLineNumber(row?.[0], 'right'), {
      id: 'rightLineNumber',
      header: '1',
      size: lineNumberCellWidth,
      minSize: 17,
      enableResizing: false,
    }),
  ];
  for (let i = 2; i < headerRow.length; i++) {
    col.push(
      columnHelper.accessor((row) => row[i], {
        header: headerRow[i],
        id: headerRow[i]
          ? `${headerRow[i].replace(/[^A-Za-z0-9]/g, '')}_col_${i}`
          : `col_${i}`,
      }),
    );
  }
  return col;
}

function processSchemaRow(schemaRow: string[] | false) {
  const backgroundStates = [];
  if (schemaRow) {
    for (let i = 2; i < schemaRow.length; i++) {
      if (schemaRow[i] === '+++') {
        backgroundStates.push(BackgroundStates.Inserted);
      } else if (schemaRow[i] === '---') {
        backgroundStates.push(BackgroundStates.Removed);
      } else if (schemaRow[i] === ':') {
        backgroundStates.push(BackgroundStates.Reordered);
      } else if (schemaRow[i].startsWith('(') && schemaRow[i].endsWith(')')) {
        backgroundStates.push(BackgroundStates.CellDiff);
      } else if (schemaRow[i].startsWith(':') && schemaRow[i].endsWith(')')) {
        backgroundStates.push(BackgroundStates.CellDiff);
      } else {
        backgroundStates.push(BackgroundStates.Unchanged);
      }
    }
  }
  return backgroundStates;
}

function getRowBackgroundState(
  headerBackgroundState: BackgroundStates[],
  row: string[],
): BackgroundStates[] {
  const backgroundStates: BackgroundStates[] = [];
  for (let j = 2; j < row.length; j++) {
    if (
      row[1] === ':' ||
      headerBackgroundState[j - 2] === BackgroundStates.Reordered
    ) {
      backgroundStates.push(BackgroundStates.Reordered);
    } else if (
      row[1] === '+++' ||
      headerBackgroundState[j - 2] === BackgroundStates.Inserted
    ) {
      backgroundStates.push(BackgroundStates.Inserted);
    } else if (
      row[1] === '---' ||
      headerBackgroundState[j - 2] === BackgroundStates.Removed
    ) {
      backgroundStates.push(BackgroundStates.Removed);
    } else {
      backgroundStates.push(BackgroundStates.Unchanged);
    }
  }
  return backgroundStates;
}

function cellDiffRender(newContent: string, oldContent: string) {
  return (
    <>
      <div className={css.left}>{newContent}</div>
      <div className={css.right}>{oldContent}</div>
    </>
  );
}

function cellRenderHelper(
  cell: Cell<string[], string>,
  actionColumnIndicator: string,
) {
  if (!actionColumnIndicator.includes('>') || !cell.getValue()) {
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }
  const rawString = cell.getValue() as string;
  const diffCells = rawString.split(actionColumnIndicator);
  if (diffCells.length === 2) {
    return cellDiffRender(diffCells[0], diffCells[1]);
  } else {
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }
}

function hasCellDiff(rawCell: string, actionColumnIndicator: string) {
  if (actionColumnIndicator.includes('>') && rawCell) {
    return rawCell.split(actionColumnIndicator).length === 2;
  } else {
    return false;
  }
}

function generateRichText(
  removeText: string,
  insertText: string,
  bold: boolean = false,
) {
  const richText = [];
  if (removeText) {
    richText.push({
      font: {
        bold: bold,
        color: {
          argb: textColor[BackgroundStates.Removed],
        },
      },
      text: removeText,
    });
  }
  if (insertText) {
    richText.push({
      font: {
        bold: bold,
        color: {
          argb: textColor[BackgroundStates.Inserted],
        },
      },
      text: insertText,
    });
  }
  return {
    richText,
  };
}

function formatCellFillAndColor(
  cell: ExcelCell,
  backgroundState: BackgroundStates,
  formatBackground: boolean = true,
  bold: boolean = false,
) {
  if (
    formatBackground &&
    (backgroundState === BackgroundStates.Inserted ||
      backgroundState === BackgroundStates.Removed ||
      backgroundState === BackgroundStates.Reordered)
  ) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: backgroundColor[backgroundState],
      },
    };
  }
  // Always set the font colour based on the state
  cell.font = {
    bold: bold,
    color: {
      argb: textColor[backgroundState],
    },
  };
}

function padTime(rawTime: number) {
  return rawTime.toString().padStart(2, '0');
}

const ExcelDiffOutputUnified = forwardRef<
  ExportToExcelRef,
  ExcelDiffOutputUnifiedProps
>(function ExcelDiffOutputUnified({ diffTable, maxLines }, ref) {
  const prevTable = usePrevious(diffTable);
  const headerRowNumber = diffTable[1][1] === '!' ? 2 : 1;
  const schemaRow = headerRowNumber === 2 && diffTable[headerRowNumber - 1];
  const maxDigits = maxLines.toString().length;
  // Line number cell width is fixed since its a monospaced font.
  const lineNumberCellWidth = 9 * maxDigits + 8;
  // Arbitrarily picked default cell width
  const defaultCellWidth = 150;
  const headerBackgroundState = useMemo(
    () => processSchemaRow(schemaRow),
    [schemaRow],
  );

  useEffect(() => {
    backgroundColor[BackgroundStates.Inserted] = getCssVariableHex(
      '--theme-colors-background-green-secondary-default',
      document.documentElement,
    ).replace('#', 'FF');
    backgroundColor[BackgroundStates.Removed] = getCssVariableHex(
      '--theme-colors-background-red-secondary-default',
      document.documentElement,
    ).replace('#', 'FF');
    backgroundColor[BackgroundStates.Reordered] = getCssVariableHex(
      '--theme-colors-background-blue-secondary-default',
      document.documentElement,
    ).replace('#', 'FF');
    textColor[BackgroundStates.Inserted] = getCssVariableHex(
      '--theme-colors-text-green-secondary',
      document.documentElement,
    ).replace('#', 'FF');
    textColor[BackgroundStates.Removed] = getCssVariableHex(
      '--theme-colors-text-red-secondary',
      document.documentElement,
    ).replace('#', 'FF');
    textColor[BackgroundStates.Reordered] = getCssVariableHex(
      '--theme-colors-text-blue-secondary',
      document.documentElement,
    ).replace('#', 'FF');
  }, []);

  const exportPDFStatus = usePdfIsExporting();

  // may move this to a worker in future PR.
  const exportToExcel = useCallback(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const diffSheet = workbook.addWorksheet('Excel Diff Result');
    const firstRow = diffSheet.addRow(['1', '1']);
    for (let i = 2; i < diffTable[headerRowNumber].length; i++) {
      const reorderedAndRenamed =
        diffTable[headerRowNumber - 1][i].startsWith(':') &&
        diffTable[headerRowNumber - 1][i].endsWith(')');
      if (headerBackgroundState[i - 2] === BackgroundStates.CellDiff) {
        firstRow.getCell(i + 1).value = generateRichText(
          extractDiffText(
            diffTable[headerRowNumber - 1][i],
            reorderedAndRenamed,
          ),
          diffTable[headerRowNumber][i],
          true,
        );
      } else {
        firstRow.getCell(i + 1).value = diffTable[headerRowNumber][i];
        formatCellFillAndColor(
          firstRow.getCell(i + 1),
          headerBackgroundState[i - 2],
          true,
          true,
        );
      }
    }
    firstRow.alignment = { horizontal: 'center' };
    firstRow.commit();
    for (let i = headerRowNumber + 1; i < diffTable.length; i++) {
      const row = diffSheet.addRow([]);
      row.getCell(1).value = getLineNumber(diffTable[i][0], 'left');
      row.getCell(2).value = getLineNumber(diffTable[i][0], 'right');
      // Either a cell diff or a row removal should make the left line number red.
      if (diffTable[i][1].includes('-')) {
        formatCellFillAndColor(row.getCell(1), BackgroundStates.Removed, false);
      }
      // Either a cell diff or a row addition should make the right line number green.
      if (diffTable[i][1] === '+++' || diffTable[i][1].includes('->')) {
        formatCellFillAndColor(
          row.getCell(2),
          BackgroundStates.Inserted,
          false,
        );
      }
      // If the row is a reordering, make both line numbers blue.
      if (diffTable[i][1] === ':') {
        formatCellFillAndColor(
          row.getCell(1),
          BackgroundStates.Reordered,
          false,
        );
        formatCellFillAndColor(
          row.getCell(2),
          BackgroundStates.Reordered,
          false,
        );
      }
      for (let j = 2; j < diffTable[i].length; j++) {
        const backgroundState = getRowBackgroundState(
          headerBackgroundState,
          diffTable[i],
        );
        if (!diffTable[i][1].includes('>') || !diffTable[i][j]) {
          row.getCell(j + 1).value = diffTable[i][j] ? diffTable[i][j] : '';
          formatCellFillAndColor(row.getCell(j + 1), backgroundState[j - 2]);
        } else {
          const split = diffTable[i][j].split(diffTable[i][1]);
          if (split.length === 2) {
            row.getCell(j + 1).value = generateRichText(split[0], split[1]);
          } else {
            row.getCell(j + 1).value = diffTable[i][j];
          }
        }
      }
      row.commit();
    }
    // width ranges from 0-255, default width is 8.43, excel js stores width as undefined if default.
    diffSheet.getColumn(1).width = 8.43 / 2;
    diffSheet.getColumn(2).width = 8.43 / 2;
    const curTime = new Date();
    const fileBuffer = await workbook.xlsx.writeBuffer();
    const xlsxBlob = new Blob([fileBuffer]);
    const xlsxUrl = URL.createObjectURL(xlsxBlob);
    const a = document.createElement('a');
    a.href = xlsxUrl;
    a.download = `export-${curTime.getFullYear()}
        ${padTime(curTime.getMonth() + 1)}
        ${padTime(curTime.getDate())}-
        ${padTime(curTime.getHours())}
        ${padTime(curTime.getMinutes())}
        ${padTime(curTime.getSeconds())}.xlsx`.replace(/\s/g, '');
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(xlsxUrl);
      a.remove();
    }, 1000);
  }, [diffTable, headerBackgroundState, headerRowNumber]);

  useImperativeHandle(ref, () => ({
    exportToExcel,
  }));

  // Table is memoized so that it retains a stable reference (necessary for tanstack-table)
  const memoTable = useMemo(() => {
    const startIndex = headerRowNumber === 2 ? 3 : 2;
    return new Proxy(diffTable, {
      get(target, prop) {
        if (prop === 'length') {
          return target.length - startIndex;
        }
        if (typeof prop === 'string') {
          const index = parseInt(prop);
          if (!isNaN(index)) {
            return target[index + startIndex];
          }
        }
      },
    });
  }, [diffTable, headerRowNumber]);

  const table = useReactTable({
    data: memoTable,
    columns: colDef(diffTable[headerRowNumber], lineNumberCellWidth),
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: defaultCellWidth,
      minSize: defaultCellWidth / 2,
      maxSize: Number.MAX_SAFE_INTEGER,
    },
  });

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: string } = {};
    if (prevTable !== diffTable) {
      table.resetColumnSizing();
      // need manual col-sizing values here since resetColumnSizing is basically a setState (async)
      for (let i = 0; i < headers.length; i++) {
        if (
          headers[i].column.id === 'leftLineNumber' ||
          headers[i].column.id === 'rightLineNumber'
        ) {
          colSizes[`--col-size-${headers[i].column.id}`] =
            `${lineNumberCellWidth}px`;
        } else {
          colSizes[`--col-size-${headers[i].column.id}`] =
            `${defaultCellWidth}px`;
        }
      }
    } else {
      for (let i = 0; i < headers.length; i++) {
        if (prevTable !== diffTable) {
        } else {
          colSizes[`--col-size-${headers[i].column.id}`] =
            `${headers[i].getSize()}px`;
        }
      }
    }
    return colSizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, diffTable]); // columnSizingInfo will provide the necessary updates
  // Line number cell width is dependant on diffTable.
  // prevTable is changes whenever diffTable changes.
  // We don't want to update table based on all state changes within the table, only on column sizing changes.

  const { rows } = table.getRowModel();

  // Extracts the text from the header diff cell.
  // If the cell is a reordered and renamed cell, the text is extracted from the second character to the second last character. (e.g. ':(HeaderName)' -> 'HeaderName')
  // Otherwise, the text is extracted from the first character to the second last character. (e.g. '(HeaderName)' -> 'HeaderName')
  function extractDiffText(text: string, reorderedAndRenamed: boolean): string {
    return text.slice(reorderedAndRenamed ? 2 : 1, -1);
  }

  const renderHeaderRow = useCallback(
    (
      props: ItemProps<unknown>,
      table: Table<string[]>,
      headerBackgroundState: BackgroundStates[],
      lineNumberCellWidth: number,
      diffTable: string[][],
      headerRowNumber: number,
    ) => (
      <div {...props} className={css.tr}>
        {table
          .getFlatHeaders()
          .map((header: Header<string[], unknown>, cellIndex: number) => {
            const reorderedAndRenamed =
              diffTable[headerRowNumber - 1][cellIndex].startsWith(':') &&
              diffTable[headerRowNumber - 1][cellIndex].endsWith(')');
            return (
              <div
                key={header.id}
                style={{
                  width: `var(--col-size-${header.column.id})`,
                  position: cellIndex < 2 ? 'sticky' : 'relative',
                  left:
                    cellIndex < 2
                      ? `${cellIndex * lineNumberCellWidth}px`
                      : undefined,
                }}
                className={cx(css.th, {
                  [css.isResizing]: header.column.getIsResizing(),
                  [css.cellInserted]:
                    headerBackgroundState[cellIndex - 2] ===
                    BackgroundStates.Inserted,
                  [css.cellReordered]:
                    headerBackgroundState[cellIndex - 2] ===
                    BackgroundStates.Reordered,
                  [css.cellRemoved]:
                    headerBackgroundState[cellIndex - 2] ===
                    BackgroundStates.Removed,
                  [css.cellDiffed]:
                    headerBackgroundState[cellIndex - 2] ===
                    BackgroundStates.CellDiff,
                })}
              >
                {headerBackgroundState[cellIndex - 2] ===
                BackgroundStates.CellDiff
                  ? cellDiffRender(
                      extractDiffText(
                        diffTable[headerRowNumber - 1][cellIndex],
                        reorderedAndRenamed,
                      ),
                      header.column.columnDef.header as string,
                    )
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                <div
                  className={cx({
                    [css.resizer]: header.column.getCanResize(),
                    [css.isResizing]: header.column.getIsResizing(),
                  })}
                  role="button"
                  tabIndex={0}
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      header.getResizeHandler()(e);
                    }
                  }}
                />
              </div>
            );
          })}
      </div>
    ),
    [],
  );

  const renderDataRow = useCallback(
    (
      props: ItemProps<unknown>,
      row: Row<string[]>,
      backgroundState: BackgroundStates[],
      memoTable: string[][],
      rowIndex: number,
      lineNumberCellWidth: number,
    ) => (
      <div {...props} className={css.tr}>
        {row
          .getVisibleCells()
          .map((cell: Cell<string[], string>, cellIndex: number) => (
            <div
              key={cell.id}
              style={{
                width: `var(--col-size-${cell.column.id})`,
                position: cellIndex < 2 ? 'sticky' : 'relative',
                left:
                  cellIndex < 2
                    ? `${cellIndex * lineNumberCellWidth}px`
                    : undefined,
              }}
              className={cx(css.td, {
                [css.cellReordered]:
                  backgroundState[cellIndex - 2] === BackgroundStates.Reordered,
                [css.cellInserted]:
                  backgroundState[cellIndex - 2] === BackgroundStates.Inserted,
                [css.cellRemoved]:
                  backgroundState[cellIndex - 2] === BackgroundStates.Removed,
                [css.cellDiffed]: hasCellDiff(
                  cell.getValue(),
                  memoTable[rowIndex - 1][1],
                ),
                [css.numberDeletion]:
                  cellIndex === 0 && memoTable[rowIndex - 1][1].includes('-'),
                [css.numberAddition]:
                  cellIndex === 1 &&
                  (memoTable[rowIndex - 1][1] === '+++' ||
                    memoTable[rowIndex - 1][1].includes('->')),
                [css.numberReorder]:
                  (cellIndex === 1 || cellIndex === 0) &&
                  memoTable[rowIndex - 1][1] === ':',
              })}
            >
              {cellRenderHelper(cell, memoTable[rowIndex - 1][1])}
            </div>
          ))}
      </div>
    ),
    [],
  );

  const CustomItem = useCallback(
    (props: ItemProps<unknown>) => {
      const rowIndex = props['data-index'];
      if (rowIndex === 0) {
        return renderHeaderRow(
          props,
          table,
          headerBackgroundState,
          lineNumberCellWidth,
          diffTable,
          headerRowNumber,
        );
      }
      const row = rows[rowIndex - 1];
      const backgroundState = getRowBackgroundState(
        headerBackgroundState,
        memoTable[rowIndex - 1],
      );
      return renderDataRow(
        props,
        row,
        backgroundState,
        memoTable,
        rowIndex,
        lineNumberCellWidth,
      );
    },
    [
      diffTable,
      headerBackgroundState,
      headerRowNumber,
      lineNumberCellWidth,
      memoTable,
      rows,
      table,
      renderHeaderRow,
      renderDataRow,
    ],
  );

  return (
    <div className={css.tableWrapper}>
      <div
        className={cx(css.table, {
          [css.virtuoso]: !exportPDFStatus,
        })}
        style={{ ...columnSizeVars }}
      >
        {exportPDFStatus ? (
          Array(rows.length + 1)
            .fill(0)
            .map((_, i) => (
              <CustomItem
                key={i}
                data-index={i}
                data-item-index={i}
                data-known-size={0}
                item={null}
              />
            ))
        ) : (
          <Virtuoso
            totalCount={rows.length + 1} // rows does not count header row
            components={{
              Item: CustomItem,
            }}
            style={{ height: '80vh' }}
            topItemCount={1}
            overscan={{
              main: 2000,
              reverse: 2000,
            }}
            useWindowScroll
          />
        )}
      </div>
    </div>
  );
});

export default ExcelDiffOutputUnified;
