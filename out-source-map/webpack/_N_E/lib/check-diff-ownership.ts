import { type AnonDiff } from 'types/anonDiff';
import { type Diff } from 'types/diff';
import { type User } from 'types/user';

const checkDiffOwnership = ({
  secretDiffs,
  diff,
  user,
}: {
  secretDiffs: AnonDiff[];
  diff: Diff;
  user?: User;
}) => {
  return (
    secretDiffs.find((secretDiff) => secretDiff.slug === diff.slug) !==
      undefined ||
    (user !== undefined &&
      (diff.userId === user.id || // TODO: fix backend so we don't need to look in 2 places
        diff.user?.id === user.id))
  );
};

export default checkDiffOwnership;
