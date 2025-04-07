import { useWorker } from 'lib/hooks/use-worker';
import { useEffect, useMemo, useState } from 'react';
import { Diff } from 'types/diff';
import { TextDiffOutputSettingsObject } from '../settings';
import makeUnified from '../commands/make-unified';

const useProcessDiffForSettings = (
  diff: Diff,
  settings: TextDiffOutputSettingsObject,
  onChange?: (newDiff: Diff) => void,
) => {
  const [normalizeWorker] = useWorker('normalize', { restartable: true });
  const [normalizedDiff, setNormalizedDiff] = useState<Diff>(diff);

  const { diffLevel, diffType } = settings;

  useEffect(() => {
    const changeToDiffLevel = async () => {
      const { data: newDiffData } = await normalizeWorker({
        left: diff.left ?? '',
        right: diff.right ?? '',
        diffLevel: diffLevel,
      });

      if (newDiffData) {
        setNormalizedDiff({
          ...diff,
          ...newDiffData,
        });
        onChange?.(newDiffData);
      }
    };

    if (diff.diffLevel !== diffLevel) {
      changeToDiffLevel();
    } else {
      setNormalizedDiff(diff);
    }
  }, [diff, diffLevel, normalizeWorker, normalizedDiff.diffLevel]);

  const processedDiff = useMemo<Diff>(() => {
    return diffType === 'unified'
      ? makeUnified(normalizedDiff)
      : normalizedDiff;
  }, [diffType, normalizedDiff]);

  return processedDiff;
};

export default useProcessDiffForSettings;
