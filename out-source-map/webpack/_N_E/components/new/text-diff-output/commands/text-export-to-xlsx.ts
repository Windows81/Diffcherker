import { type Chunk } from 'types/normalize';
import { type Meta as Row } from 'types/normalize';
import * as ExcelJS from 'exceljs';

enum BackgroundStates {
  Inserted = 'insert',
  Removed = 'remove',
  None = 'none',
}

// not gonna use our theme colours, this is for greater visual clarity on spreadsheet
const backgroundColor: Record<BackgroundStates, string> = {
  [BackgroundStates.Inserted]: 'C6EFCE',
  [BackgroundStates.Removed]: 'FFC7CE',
  [BackgroundStates.None]: 'F2F2F2',
};

const textColor: Partial<Record<BackgroundStates, string>> = {
  [BackgroundStates.Inserted]: '006100',
  [BackgroundStates.Removed]: '9C0006',
};

const applyFont = (backgroundState: BackgroundStates) => {
  return {
    color: { argb: textColor[backgroundState] },
    bold: true,
  };
};

const applyFill = (backgroundState: BackgroundStates): ExcelJS.Fill => {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: backgroundColor[backgroundState] },
  };
};

const columnWidths = [10, 50, 10, 50];

export type BlockRows = {
  data: Row;
  index: number;
}[];

export const exportToExcel = async (
  blockRowsList: BlockRows[],
  title: string = 'Untitled Diff',
) => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    worksheet.columns = columnWidths.map((width) => ({ width }));

    const processRow = (row: { data: Row; index: number }) => {
      const rowData = row.data;
      const rowNumber = row.index + 1;

      const changed = rowData.insideChanged;

      const left = rowData.left;
      const right = rowData.right;

      // using list comprehension to make cells because i dont want to paste the same things 4 times over
      const columns = ['A', 'B', 'C', 'D'];

      const cells = columns.map((column) => {
        const cell = worksheet.getCell(`${column}${rowNumber}`);
        cell.alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true,
        };
        return cell;
      });

      cells[0].value = left.line;
      cells[2].value = right.line;

      const chunksToRichtext = (chunks: Chunk[]) => {
        const getTextStyle = (chunk: Chunk) => {
          if (!changed) {
            return;
          }
          if (chunk.type === BackgroundStates.Removed) {
            return applyFont(BackgroundStates.Removed);
          } else if (chunk.type === BackgroundStates.Inserted) {
            return applyFont(BackgroundStates.Inserted);
          }
          // when undefined or neither, exceljs automatically uses default font
        };

        return {
          richText: chunks.map((chunk) => {
            if (chunk.value) {
              return { text: chunk.value, font: getTextStyle(chunk) };
            } else {
              return { text: '' };
            }
          }),
        };
      };

      cells[1].value = chunksToRichtext(left.chunks);
      cells[3].value = chunksToRichtext(right.chunks);

      // the inside is not marked as changed if either the left or right are empty
      if (!left.chunks.length && right.chunks.length > 0) {
        cells[1].fill = applyFill(BackgroundStates.None);
        cells[3].fill = applyFill(BackgroundStates.Inserted);
      } else if (left.chunks.length > 0 && !right.chunks.length) {
        cells[1].fill = applyFill(BackgroundStates.Removed);
        cells[3].fill = applyFill(BackgroundStates.None);
      } else if (changed) {
        cells[1].fill = applyFill(BackgroundStates.Removed);
        cells[3].fill = applyFill(BackgroundStates.Inserted);
      }
    };

    blockRowsList.forEach((blockRows) => {
      blockRows?.forEach((blockRow) => {
        processRow(blockRow);
      });
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([excelBuffer]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  } catch (error) {
    console.error('error exporting to excel', error);
  }
};
