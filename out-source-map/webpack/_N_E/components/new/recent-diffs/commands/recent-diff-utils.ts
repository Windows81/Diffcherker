const MAX_RECENT_DIFFS = 50;
// for our current purposes, we could derive this as just x2 MAX_RECENT_DIFFS
// but its best not to if we ever want to extend recent files in the future
const MAX_RECENT_FILES = 100;

import * as electron from '../../../../lib/state/electron';
import { DiffInputType } from 'types/diff-input-type';
import getNameFromFilePath from 'lib/get-name-from-file-path';
import ipcEvents from 'ipc-events';
import { calculateHash } from 'lib/calculate-buffer-hash';

// recent diffs

export type RecentDiff = {
  left: RecentDiffSide;
  right: RecentDiffSide;
  lastOpened: number; // time in ms since epoch
  diffType: DiffInputType;
};

type RecentDiffSide = {
  fileName: string;
  filePath: string;
};

interface AddRecentDiffProps {
  left: {
    filePath: string;
  };
  right: {
    filePath: string;
  };
  diffType: DiffInputType;
}

export const addRecentDiff = ({
  left,
  right,
  diffType,
}: AddRecentDiffProps) => {
  const { filePath: leftPath } = left;
  const { filePath: rightPath } = right;

  const leftName = getNameFromFilePath(leftPath);
  const rightName = getNameFromFilePath(rightPath);

  const newDiff: RecentDiff = {
    left: {
      fileName: leftName,
      filePath: leftPath,
    },
    right: {
      fileName: rightName,
      filePath: rightPath,
    },
    lastOpened: Date.now(),
    diffType,
  };

  addRecentDiffToStore(newDiff);

  addRecentFile({
    filePath: leftPath,
    diffType,
  });
  addRecentFile({
    filePath: rightPath,
    diffType,
  });
};

interface AddRecentTextDiffProps {
  left: {
    data?: string;
  };
  right: {
    data?: string;
  };
}

const saveFileTask = async (data: string) => {
  // storing hash as file name so we overwrite duplicates
  const encoder = new TextEncoder();

  const arrayBuffer = encoder.encode(data);
  const hash = await calculateHash(arrayBuffer.buffer as ArrayBuffer);

  const { filePath } = await window.ipcRenderer.invoke(
    ipcEvents.APP__SAVE_FILE,
    {
      data,
      fileName: `${hash}.txt`,
    },
  );

  return filePath;
};

export const addRecentTextDiff = async ({
  left,
  right,
}: AddRecentTextDiffProps) => {
  if (!left.data && !right.data) {
    return;
  }

  const leftData = left.data || '';
  const rightData = right.data || '';

  const [leftPath, rightPath] = await Promise.all([
    saveFileTask(leftData),
    saveFileTask(rightData),
  ]);

  const newDiff: RecentDiff = {
    left: {
      fileName: leftData.substring(0, 100),
      filePath: leftPath,
    },
    right: {
      fileName: rightData.substring(0, 100),
      filePath: rightPath,
    },
    lastOpened: Date.now(),
    diffType: DiffInputType.TEXT,
  };

  addRecentDiffToStore(newDiff);
};

const addRecentDiffToStore = (newDiff: RecentDiff) => {
  const currentRecentDiffs = getRecentDiffs();
  let newRecentDiffs = [
    newDiff,
    ...currentRecentDiffs.filter(
      (diff) =>
        !isSameDiff(
          diff,
          newDiff.left.filePath,
          newDiff.right.filePath,
          newDiff.diffType,
        ),
    ),
  ];
  if (newRecentDiffs.length > MAX_RECENT_DIFFS) {
    const toBePurgedDiffs = newRecentDiffs.slice(MAX_RECENT_DIFFS);
    newRecentDiffs = newRecentDiffs.slice(0, MAX_RECENT_DIFFS);
    toBePurgedDiffs.forEach((diff) => {
      safelyDeleteTextDiffFile(
        diff.diffType,
        diff.left.filePath,
        newRecentDiffs,
      );
      safelyDeleteTextDiffFile(
        diff.diffType,
        diff.right.filePath,
        newRecentDiffs,
      );
    });
  }
  setRecentDiffs(newRecentDiffs);
};

export const deleteRecentDiff = (
  leftPath: string,
  rightPath: string,
  diffType: DiffInputType,
) => {
  const currentRecentDiffs = getRecentDiffs();
  const newRecentDiffs = currentRecentDiffs.filter(
    (diff) => !isSameDiff(diff, leftPath, rightPath, diffType),
  );

  safelyDeleteTextDiffFile(diffType, leftPath, newRecentDiffs);
  safelyDeleteTextDiffFile(diffType, rightPath, newRecentDiffs);

  setRecentDiffs(newRecentDiffs);
};

const safelyDeleteTextDiffFile = async (
  diffType: DiffInputType,
  toBePurgedFilePath: string,
  currentDiffs: RecentDiff[],
) => {
  if (
    diffType !== DiffInputType.TEXT ||
    isOtherRecentDiffUsingFile(currentDiffs, toBePurgedFilePath)
  ) {
    return;
  }

  const response = await window.ipcRenderer.invoke(
    ipcEvents.APP__DELETE_FILES,
    { paths: [toBePurgedFilePath] },
  );
  if (response.error) {
    console.error('Error deleting file:', response.error);
  }
};

const isOtherRecentDiffUsingFile = (
  currentDiffs: RecentDiff[],
  toBePurgedFilePath: string,
) => {
  return currentDiffs.some(
    (diff) =>
      diff.left.filePath === toBePurgedFilePath ||
      diff.right.filePath === toBePurgedFilePath,
  );
};

const isSameDiff = (
  currentDiff: RecentDiff,
  newLeftPath: string,
  newRightPath: string,
  newDiffType: DiffInputType,
) => {
  const isSameType = currentDiff.diffType === newDiffType;
  const isSamePath =
    currentDiff.left.filePath === newLeftPath &&
    currentDiff.right.filePath === newRightPath;
  const isSamePathSwapped =
    currentDiff.left.filePath === newRightPath &&
    currentDiff.right.filePath === newLeftPath;

  return isSameType && (isSamePath || isSamePathSwapped);
};

export const getRecentDiffs = (): RecentDiff[] => {
  return electron.storeGet('recent.diffs') || [];
};

const setRecentDiffs = (diffs: RecentDiff[]) => {
  electron.storeSet('recent.diffs', diffs);
};

// recent files

// TODO: rename all occurences of 'file' to 'entry', I wasnt really thinking of folder diffs when I wrote this

export type RecentFile = {
  filePath: string;
  fileName: string;
  lastOpened: number;
  diffType: DiffInputType;
};

interface AddRecentFileProps {
  filePath: string;
  diffType: DiffInputType;
}

export const addRecentFile = ({ filePath, diffType }: AddRecentFileProps) => {
  const fileName = getNameFromFilePath(filePath);

  const currentRecentFiles = getRecentFiles();
  const file: RecentFile = {
    filePath,
    fileName,
    lastOpened: Date.now(),
    diffType,
  };

  let newRecentFiles = [
    file,
    ...currentRecentFiles.filter(
      (file) => !isSameFile(file, filePath, diffType),
    ),
  ];
  if (newRecentFiles.length > MAX_RECENT_FILES) {
    newRecentFiles = newRecentFiles.slice(0, MAX_RECENT_FILES);
  }
  setRecentFiles(newRecentFiles);
};

// typically, removing a text file from recents that points to docstorage in any way should also
// delete the actual file inside docstorage
// however for the implementation of recent files we have right now, theoretically, no recent file
// should point to the docstorage so we dont worry about that here
export const deleteRecentFile = (filePath: string, diffType: DiffInputType) => {
  const currentRecentFiles = getRecentFiles();
  const newRecentFiles = currentRecentFiles.filter(
    (file) => !isSameFile(file, filePath, diffType),
  );

  setRecentFiles(newRecentFiles);
};

const isSameFile = (
  file: RecentFile,
  filePath: string,
  diffType: DiffInputType,
) => {
  return file.filePath === filePath && file.diffType === diffType;
};

export const getRecentFiles = (): RecentFile[] => {
  return electron.storeGet('recent.files') || [];
};

const setRecentFiles = (files: RecentFile[]) => {
  electron.storeSet('recent.files', files);
};
