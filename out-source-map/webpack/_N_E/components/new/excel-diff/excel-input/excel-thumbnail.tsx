import css from './excel-thumbnail.module.css';
import { excelLogger } from 'lib/logger';

interface ExcelThumbnailProps {
  sheet: string[][];
  selectedHeaderLine: number;
}

const ExcelThumbnail: React.FC<ExcelThumbnailProps> = ({
  sheet,
  selectedHeaderLine,
}) => {
  excelLogger.info('Rendering thumbnail');
  // Limit the number of rows and columns to show in thumbnail
  const MAX_ROWS = 100;
  const MAX_COLS = 10;

  function formatRowNumber(num: number): string {
    // Adjust the threshold to control when scientific notation is used for row numbers.
    const threshold = 1000;
    if (num >= threshold) {
      return num.toExponential(0);
    }
    return num.toString();
  }

  return (
    <div className={css.container}>
      <table className={css.table}>
        <tbody>
          <tr>
            <th className={css.topLeftCell}></th>
            {Array.from({ length: MAX_COLS }).map((_, index) => (
              <th key={`col-${index}`} className={css.columnHeader}>
                {String.fromCharCode(65 + index)}
              </th>
            ))}
          </tr>

          {Array.from({ length: MAX_ROWS }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className={css.rowNumberCell}>
                {formatRowNumber(rowIndex + (selectedHeaderLine || 1))}
              </td>

              {Array.from({ length: MAX_COLS }).map((_, colIndex) => (
                <td
                  className={css.dataCell}
                  key={colIndex}
                  data-is-header={rowIndex === 0}
                  data-is-last-column={colIndex === MAX_COLS - 1}
                  data-is-last-row={rowIndex === MAX_ROWS - 1}
                >
                  {sheet[rowIndex + (selectedHeaderLine || 1) - 1]?.[
                    colIndex
                  ] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelThumbnail;
