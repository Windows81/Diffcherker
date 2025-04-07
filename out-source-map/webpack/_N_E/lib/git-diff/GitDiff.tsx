import { atom } from 'jotai';

import { GitDiffWorkerPool } from './GitDiffWorkerPool';
import { GitDiffEntry } from './GitDiffEntry';
import { FileEntry, GitDiffFileData, GitDiffType } from './types';

import { gitDiffFileAtomFamily } from './gitDiffFileAtomFamily';
import css from './GitDiff.module.css';
import { GitDiffSidebar } from './GitDiffSidebar';
import { getGitDiffStatus } from './getFileStatus';
import PlusCircleIcon from 'web/components/shared/icons/plus-circle.svg';
import MinusCircleIcon from 'web/components/shared/icons/minus-circle.svg';
import EditCircleIcon from 'web/components/shared/icons/edit-circle.svg';
import MoveCircleIcon from 'web/components/shared/icons/move-circle.svg';
import Icon from 'components/shared/icon';
import { useMemo, useState } from 'react';
import {
  TextDiffOutputSettingsObject,
  defaultTextDiffOutputSettings,
} from 'components/new/text-diff-output/settings';

/**
 * Data sent upstream when a diff is requested to be opened in a new
 * window.
 */
interface OpenDiffData {
  file: FileEntry;
  diffType: GitDiffType | null;
}

interface GitDiffProps {
  /**
   * Ordered list of files to display in the tree view and diff view.
   * This does _NOT_ include the file data or diff data, both of
   * which are fetched separately and on-demand.
   */
  files: FileEntry[];

  /**
   * Called when a given file needs its data to be loaded. This is
   * needed if the diff data for the file was never computed, or it
   * was evicted (e.g. due to memory pressure).
   * @param file The name of the file.
   * @returns Promise resolving with the left/right sides of the file
   */
  onLoadFileData: (name: string) => Promise<GitDiffFileData>;

  /**
   * Handler called when the user requests to open the individual file
   * in a new tab/window.
   * @param openDiffData
   * @returns Nothing.
   */
  onOpenDiff: (openDiffData: OpenDiffData) => void;

  /**
   * The worker pool to use.
   */
  workerPool: GitDiffWorkerPool;
}

/**
 * Component that represents the entire diff view, including the file
 * list sidebar and the scrollable area of all the files.
 */
export const GitDiff: React.FC<GitDiffProps> = ({
  files,
  onLoadFileData,
  onOpenDiff,
  workerPool,
}) => {
  const [sharedTextSettings, setSharedTextSettings] =
    useState<TextDiffOutputSettingsObject>({
      ...defaultTextDiffOutputSettings,
      diffCompression: 'collapsed',
    });

  const fileAtomFamily = useMemo(() => {
    const workerPoolAtom = atom(workerPool);

    // Functions cannot be stored directly as atoms.
    // See: https://stackoverflow.com/questions/73449599
    const getFileDataBaseAtom = atom({ fn: onLoadFileData });
    const getFileDataAtom = atom(
      (get) => get(getFileDataBaseAtom).fn,
      (_, set, fn: typeof onLoadFileData) => set(getFileDataBaseAtom, { fn }),
    );

    return gitDiffFileAtomFamily({
      workerPoolAtom,
      getFileDataAtom,
    });
  }, [workerPool, onLoadFileData]);

  const { total, removed, added, modified, renamed } = useMemo(() => {
    let removed = 0;
    let added = 0;
    let modified = 0;
    let renamed = 0;

    for (const file of files) {
      const status = getGitDiffStatus(file);
      if (status === 'add') {
        added++;
      } else if (status === 'remove') {
        removed++;
      } else if (status === 'edit') {
        modified++;
      } else if (status === 'rename') {
        renamed++;
      }
    }

    return {
      total: removed + added + modified + renamed,
      removed,
      added,
      modified,
      renamed,
    };
  }, [files]);

  return (
    <div className={css.gitDiffMainContainer}>
      <GitDiffSidebar
        files={files}
        fileAtomFamily={fileAtomFamily}
        sharedTextSettings={sharedTextSettings}
        setSharedTextSettings={setSharedTextSettings}
      />
      <div className={css.gitDiffContainer}>
        <div className={css.gitDiffHeader}>
          {total > 0 && (
            <div className={css.gitDiffHeaderChangedStatus}>
              <span>{total} changed</span>
            </div>
          )}
          {removed > 0 && (
            <div className={css.gitDiffHeaderRemovedStatus}>
              <Icon svg={MinusCircleIcon} size="small" />
              <span>{removed} removed</span>
            </div>
          )}
          {added > 0 && (
            <div className={css.gitDiffHeaderAddedStatus}>
              <Icon svg={PlusCircleIcon} size="small" />
              <span>{added} added</span>
            </div>
          )}
          {renamed > 0 && (
            <div className={css.gitDiffHeaderRenamedStatus}>
              <Icon svg={MoveCircleIcon} size="small" />
              <span>{renamed} renamed</span>
            </div>
          )}
          {modified > 0 && (
            <div className={css.gitDiffHeaderModifiedStatus}>
              <Icon svg={EditCircleIcon} size="small" />
              <span>{modified} modified</span>
            </div>
          )}
        </div>
        <div className={css.gitDiffContent}>
          {files.map((file) => {
            return (
              <GitDiffEntry
                key={file.name}
                fileAtom={fileAtomFamily(file.name)}
                onOpenDiff={onOpenDiff}
                file={file}
                sharedTextSettings={sharedTextSettings}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
