import { FolderDiffState } from 'components/folder-diff-checker';
import ipcEvents from 'ipc-events';
import { GitDiff } from 'lib/git-diff/GitDiff';
import { checkerPage } from 'lib/git-diff/GitDiffViewElectron';
import { GitDiffWorkerPool } from 'lib/git-diff/GitDiffWorkerPool';
import { FileEntry, GitDiffType } from 'lib/git-diff/types';
import { useTabOpen } from 'lib/state/tabs';
import { useCallback, useMemo, useState } from 'react';

// don't think we need this for folder diff, but b/c git diff needs it we can just use an arbitrary string
const SESSION_ID = 'folder-diff-123';

interface FolderOutputProps {
  leftFolder: FolderDiffState;
  rightFolder: FolderDiffState;
}

interface PathMap {
  [key: string]: {
    leftAbsolutePath: string | null;
    rightAbsolutePath: string | null;
  };
}

export const FolderOutput = ({
  leftFolder,
  rightFolder,
}: FolderOutputProps) => {
  const [workerPool] = useState(() => new GitDiffWorkerPool());
  const openTab = useTabOpen();

  const {
    /**
     * A collection of diffed files between the left and right folders.
     * This is needed since we want to visualize folder diffs with the git diff UI.
     */
    diffedFiles,

    /**
     * This map helps us read files from electron.
     * It acts as a workaround since git diff's callback is only given the relative path while electron needs the absolute path.
     * We should consider making the callback more flexible in the future to avoid the need for this map.
     */
    pathMap,
  } = useMemo(() => {
    const result: FileEntry[] = [];

    const leftFiles = new Map(
      leftFolder.files.map((file) => [file.relativePath, file]),
    );
    const rightFiles = new Map(
      rightFolder.files.map((file) => [file.relativePath, file]),
    );

    // TODO handle renames (i.e. set newName on files we know are being renamed)
    //      because we aren't using git data to determine this, we probably won't be able to be 100% accurate with this
    for (const leftFile of leftFolder.files) {
      const rightFile = rightFiles.get(leftFile.relativePath);
      if (rightFile) {
        // file exists on both sides (modification or unchanged)
        result.push({
          name: leftFile.relativePath,
          oldSize: leftFile.size,
          newSize: rightFile.size,
          oldUrl: leftFile.path,
          newUrl: rightFile.path,
          oldHex: leftFile.hash,
          newHex: rightFile.hash,
          sessionId: SESSION_ID,
        });
        continue;
      }

      // file exists only on left side (deletion or rename)
      result.push({
        name: leftFile.relativePath,
        oldSize: leftFile.size,
        newSize: null,
        oldUrl: leftFile.path,
        newUrl: null,
        oldHex: leftFile.hash,
        newHex: null,
        sessionId: SESSION_ID,
      });
    }

    // only need to check for files that exist in left side but not right since we already did a equality check in the prev loop
    for (const rightFile of rightFolder.files) {
      const leftFile = leftFiles.get(rightFile.relativePath);
      if (!leftFile) {
        // file exists only on right side (addition)
        result.push({
          name: rightFile.relativePath,
          oldSize: null,
          newSize: rightFile.size,
          oldUrl: null,
          newUrl: rightFile.path,
          oldHex: null,
          newHex: rightFile.hash,
          sessionId: SESSION_ID,
        });
      }
    }

    // note: I couldn't figure out how to make uppercase < lowercase sort work with localeCompare,
    //       so this'll do for now.
    const sortedResult = result.sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    // TODO can improve perf here by calling this logic inside each loop, although itll be harder to grok
    const pathMap = result.reduce((acc, file) => {
      const relativePath = file.name;
      const leftAbsolutePath = file.oldUrl;
      const rightAbsolutePath = file.newUrl;
      acc[relativePath] = { leftAbsolutePath, rightAbsolutePath };
      return acc;
    }, {} as PathMap);

    return { diffedFiles: sortedResult, pathMap };
  }, [leftFolder, rightFolder]);

  // TODO this is duplicated from GitDiffViewElectron, maybe there's a better abstraction to reduce dupe?
  const handleOpenDiff = useCallback(
    ({ file, diffType }: { file: FileEntry; diffType: GitDiffType | null }) => {
      const pageName = checkerPage[diffType as keyof typeof checkerPage];
      if (typeof pageName !== 'string') {
        return;
      }
      const query = new URLSearchParams();
      query.set('origin', 'folder-diff');
      if (file.oldUrl) {
        query.set('leftPath', file.oldUrl);
      }
      if (file.newUrl) {
        query.set('rightPath', file.newUrl);
      }

      openTab({ href: `/${pageName}?${query.toString()}`, activate: true });
    },
    [openTab],
  );

  const handleLoadFileData = useCallback(
    (name: string) => {
      // TODO is there a race condition here with when pathmap gets set?
      const absolutePaths = pathMap[name];
      if (!absolutePaths) {
        return [null, null];
      }

      return window.ipcRenderer.invoke(
        ipcEvents.APP__FOLDER_DIFF_FILE_DATA_REQUEST,
        {
          sessionId: SESSION_ID,
          paths: absolutePaths,
        },
      );
    },
    [pathMap],
  );

  return (
    <GitDiff
      files={diffedFiles}
      onLoadFileData={handleLoadFileData}
      onOpenDiff={handleOpenDiff}
      workerPool={workerPool}
    />
  );
};
