export enum RowMoveType {
  MoveStart = 'move-start',
  MoveMiddle = 'move-middle',
  MoveEnd = 'move-end',
  RightBeforeMove = 'right-before-move',
}

export type MovedTo = {
  movedFromEndExclusive: number;
  movedToStart: number;
  movedToEndExclusive: number;
  score: number;
};

export type Moves = {
  deletionToInsertionMap: MovedTo[];
  insertionToDeletionMap: MovedTo[];
};
