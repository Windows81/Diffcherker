import { compareValues } from './sortHelpers';

/**
 * Sorts rows of a 2D array while preserving the header.
 * @param data The input 2D array
 * @return The sorted 2D array with the header intact
 */
export function sortRows(data: string[][]): string[][] {
  if (!data.length) {
    return data;
  }

  const header = data[0];
  const dataRows = data.slice(1);

  const sortedDataRows = dataRows.sort((rowA, rowB) => {
    for (let i = 0; i < Math.min(rowA.length, rowB.length); i++) {
      const comparison = compareValues(rowA[i], rowB[i]);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });

  return [header, ...sortedDataRows];
}
