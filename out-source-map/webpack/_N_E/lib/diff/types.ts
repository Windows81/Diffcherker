export const enum DiffOperation {
  DELETE = -1,
  EQUAL = 0,
  INSERT = 1,
}

/**
 * The data structure representing a diff is an array of tuples:
 * [[DiffOperation.DELETE, 'Hello'], [DiffOperation.INSERT, 'Goodbye'], [DiffOperation.EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
export type DmpDiff = [DiffOperation, string];
