import { LocatableCommentEntity } from 'types/locatable-comment-entity';

export function commentLocationsEqual(
  a: LocatableCommentEntity,
  b: LocatableCommentEntity,
) {
  return a.side === b.side && a.lineNumber === b.lineNumber;
}
