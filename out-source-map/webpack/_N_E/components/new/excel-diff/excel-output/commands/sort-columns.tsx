import { compareValues } from './sortHelpers';

/**
 * Sorts columns of a nested array based on values.
 * @param data The input nested array (rows of columns)
 * @return A new nested array with columns sorted
 */
export function sortColumns(data: string[][]): string[][] {
  if (data.length === 0) {
    return data;
  }

  const columnIndices = Array.from(
    { length: data[0].length },
    (_, index) => index,
  );

  const sortedColumnIndices = columnIndices.sort((a, b) => {
    for (const row of data) {
      const comparison = compareValues(row[a], row[b]);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });

  // Create a new array with sorted columns
  const sortedData = data.map((row) =>
    sortedColumnIndices.map((index) => {
      if (index < row.length && row[index] !== undefined) {
        return row[index];
      }
      return '';
    }),
  );

  return sortedData;
}
