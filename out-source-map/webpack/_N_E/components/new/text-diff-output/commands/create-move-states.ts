import { MovedTo, Moves, RowMoveType } from 'types/moves';

export default function createMoveStates(
  moves?: Moves,
): [RowMoveType[], RowMoveType[]] {
  if (!moves) {
    return [[], []];
  }

  const leftMoveStates: RowMoveType[] = [];
  const rightMoveStates: RowMoveType[] = [];

  moves.deletionToInsertionMap.forEach(
    (movedTo: MovedTo, movedFromStart: number) => {
      if (!movedTo) {
        return;
      }
      leftMoveStates[movedFromStart - 1] =
        leftMoveStates[movedFromStart - 1] ?? RowMoveType.RightBeforeMove;
      leftMoveStates[movedFromStart] = RowMoveType.MoveStart;
      for (
        let i = movedFromStart + 1;
        i < movedTo.movedFromEndExclusive - 1;
        i++
      ) {
        leftMoveStates[i] = RowMoveType.MoveMiddle;
      }
      leftMoveStates[movedTo.movedFromEndExclusive - 1] = RowMoveType.MoveEnd;
      rightMoveStates[movedTo.movedToStart - 1] =
        rightMoveStates[movedTo.movedToStart - 1] ??
        RowMoveType.RightBeforeMove;
      rightMoveStates[movedTo.movedToStart] = RowMoveType.MoveStart;
      for (
        let i = movedTo.movedToStart + 1;
        i < movedTo.movedToEndExclusive - 1;
        i++
      ) {
        rightMoveStates[i] = RowMoveType.MoveMiddle;
      }
      rightMoveStates[movedTo.movedToEndExclusive - 1] = RowMoveType.MoveEnd;
    },
  );

  return [leftMoveStates, rightMoveStates];
}
