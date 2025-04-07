import { useSetAtom, useAtomValue } from 'jotai';
import { DiffInputType } from 'types/diff-input-type';
import { GitDiffDataProps } from '../../GitDiffDataProps';
import { GitDiffEntryError } from '../../GitDiffEntryError';
import { GitDiffEntryLoading } from '../../GitDiffEntryLoading';
import { GitDiffType } from '../../types';
import DiffBlock from 'components/new/text-diff-output/diff-block';
import css from '../../GitDiffEntry.module.css';
import { GitDiffEntryInfo } from 'lib/git-diff/GitDiffEntryInfo';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import makeUnified from 'components/new/text-diff-output/commands/make-unified';

const MAX_FILE_SIZE = 100 * 1024; // 100 KB (for reference, a code file with 30,000 lines is ~1MB)

export const GitDiffTextEntry: FC<GitDiffDataProps<GitDiffType.text>> = ({
  file,
  sharedTextSettings,
  fileAtom,
  diffAtom,
}) => {
  const { dataAtom, computeDiffAtom } = useAtomValue(diffAtom);
  const { loadingAtom, errorAtom, errorsAtom, fileDataAtom } =
    useAtomValue(fileAtom);
  const diffData = useAtomValue(dataAtom);
  const loading = useAtomValue(loadingAtom);
  const error = useAtomValue(errorAtom);
  const errors = useAtomValue(errorsAtom);
  const fileData = useAtomValue(fileDataAtom);
  const computeDiff = useSetAtom(computeDiffAtom);

  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>(
    {},
  );

  // note: performance will suffer a lot here for git diffs with many files
  const processedDiffData = useMemo(() => {
    return sharedTextSettings.diffType === 'unified' && diffData
      ? {
          ...makeUnified(diffData),
          lineNumberWidth: diffData.lineNumberWidth,
          leftLanguage: diffData.leftLanguage,
          rightLanguage: diffData.rightLanguage,
        }
      : diffData;
  }, [sharedTextSettings.diffType, diffData]);

  const isLarge = useMemo(() => {
    return fileData?.some((file) => (file?.byteLength ?? 0) > MAX_FILE_SIZE);
  }, [fileData]);

  const containerId = `text-diff-${file.name}`;
  const hasDiffData = !!diffData;
  const hasFileData = !!fileData;

  useEffect(() => {
    if (!hasFileData || hasDiffData || loading || error || isLarge) {
      return;
    }
    computeDiff();
  }, [computeDiff, hasFileData, hasDiffData, loading, error, isLarge]);

  // ensures collapse state can reset
  useEffect(() => {
    if (sharedTextSettings.diffCompression === 'collapsed') {
      setExpandedBlocks({});
    }
  }, [sharedTextSettings.diffCompression]);

  const handleExpandDiffBlock = useCallback(({ index }: { index: number }) => {
    setExpandedBlocks((prev) => {
      return {
        ...prev,
        [index]: true,
      };
    });
  }, []);

  if (!processedDiffData && loading) {
    // TODO(@izaakschroeder): Add abort handling.
    return <GitDiffEntryLoading />;
  }

  if (error) {
    // TODO(@izaakschroeder): Add retry/reset handling.
    return <GitDiffEntryError error={error} errors={errors} />;
  }

  if (!processedDiffData || !processedDiffData.blocks) {
    if (isLarge) {
      // TODO(@izaakschroeder): Add ability to show diff anyway.
      return <GitDiffEntryInfo message="Diff too big" />;
    }
    return <GitDiffEntryInfo message="No diff data" />;
  }

  // TODO(@izaakschroeder): The base component only accepts one value
  // for syntax highlighting, when theoretically it could be two.
  const syntaxHighlight =
    processedDiffData?.rightLanguage ?? processedDiffData?.leftLanguage;
  return (
    <div id={containerId} className={css.gitDiffTextEntry}>
      {processedDiffData.blocks.map((block) => {
        return (
          <DiffBlock
            block={block}
            diff={processedDiffData}
            key={block.index}
            parentId={containerId}
            index={block.index}
            isExporting={false}
            shouldCollapseLines={
              sharedTextSettings.diffCompression === 'collapsed'
            }
            isExpanded={!!expandedBlocks[block.index]}
            isUnified={sharedTextSettings.diffType === 'unified'}
            syntaxHighlight={syntaxHighlight}
            diffInputType={DiffInputType.TEXT}
            lineNumberWidth={processedDiffData.lineNumberWidth}
            allowMerging={false}
            isUserSearching={false}
            highlightChunks={undefined}
            onExpandDiffblock={handleExpandDiffBlock}
            compressOptions={{
              collapseLinesThresholdEnds: 10,
              collapseLinesPadding: 10,
              collapseLinesThreshold: 10,
            }}
          />
        );
      })}
    </div>
  );
};
