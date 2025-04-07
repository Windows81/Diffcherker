import { mimeTypesLocal } from 'lib/new/mime-types';
import { createWorker, transferSymbol } from './WorkerPool';
import { gitDiffImage } from './diff-types/image/gitDiffImage';
import { gitDiffText } from './diff-types/text/gitDiffText';

import { getFileType } from './getFileType';
import {
  GitDiffType,
  GitDiffSideMeta,
  GitDiffMeta,
  GitDiffFileData,
} from './types';
import { DiffInputType } from 'types/diff-input-type';

interface GitDiffEngine<S, T> {
  getData: (
    name: string,
    data: GitDiffFileData,
    settings: S | null | undefined,
    meta: GitDiffMeta,
  ) => T;
  canUse: (
    name: string,
    data: GitDiffFileData,
    settings: S | null | undefined,
    meta: Omit<GitDiffMeta, 'allowed'>,
  ) => T;
}

const gitDiffEngines = {
  text: {
    getData: gitDiffText,
    canUse: (_name, _data, _settings, meta) => {
      return canUseTextDiff(meta.left) && canUseTextDiff(meta.right);
    },
  },
  image: {
    getData: gitDiffImage,
    canUse: (_name, _data, _settings, meta) => {
      return canUseImageDiff(meta.left) && canUseImageDiff(meta.right);
    },
  },
  document: {
    getData: () => {
      // TODO implement this if we want to render document data in git diffs
      throw new Error('Not implemented');
    },
    canUse: (_name, _data, _settings, meta) => {
      return canUseDocumentDiff(meta.left) && canUseDocumentDiff(meta.right);
    },
  },
  spreadsheet: {
    getData: () => {
      // TODO implement this if we want to render spreadsheet data in git diffs
      throw new Error('Not implemented');
    },
    canUse: (_name, _data, _settings, meta) => {
      return (
        canUseSpreadsheetDiff(meta.left) && canUseSpreadsheetDiff(meta.right)
      );
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<GitDiffType, GitDiffEngine<any, any>>;

const canUseImageDiff = (item: GitDiffSideMeta | null | undefined) => {
  return (
    !item ||
    mimeTypesLocal[DiffInputType.IMAGE].find((mimeTypeRegex) =>
      mimeTypeRegex.test(item.mimeType),
    )
  );
};

const canUseTextDiff = (item: GitDiffSideMeta | null | undefined) => {
  return !item || item.isText;
};

const canUseDocumentDiff = (item: GitDiffSideMeta | null | undefined) => {
  return (
    !item ||
    mimeTypesLocal[DiffInputType.PDF].find((mimeTypeRegex) =>
      mimeTypeRegex.test(item.mimeType),
    )
  );
};

const canUseSpreadsheetDiff = (item: GitDiffSideMeta | null | undefined) => {
  return (
    !item ||
    mimeTypesLocal[DiffInputType.EXCEL].find((mimeTypeRegex) =>
      mimeTypeRegex.test(item.mimeType),
    )
  );
};

type DiffSettings<T extends GitDiffType> = Parameters<
  (typeof gitDiffEngines)[T]['getData']
>[2];

interface WithTransferable {
  [transferSymbol]: Transferable | Transferable[];
}

/**
 * Get the transfer list for a collection of Uint8Arrays
 * @param args List of the arrays to transfer
 * @returns Array that can be passed to `transferList`
 */
const getTransfer = (
  ...args: (Uint8Array | null | undefined)[]
): Transferable[] => {
  const transfer = [];
  for (const item of args) {
    if (item) {
      transfer.push(item.buffer);
    }
  }
  return transfer;
};

/**
 * Get the diff data for given input
 * @param file
 */
export const gitDiff = async <T extends GitDiffType>(
  name: string,
  diffType: T,
  data: GitDiffFileData,
  meta: GitDiffMeta,
  settings: DiffSettings<T>,
) => {
  try {
    // Get the selected engine and perform the diff.
    const entry = gitDiffEngines[diffType];
    const diffData = await entry.getData(
      name,
      data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings as any,
      meta,
    );

    const baseTransfer = getTransfer(...data);
    if (transferSymbol in diffData) {
      diffData[transferSymbol] = [...baseTransfer, diffData[transferSymbol]];
    } else {
      (diffData as unknown as WithTransferable)[transferSymbol] = baseTransfer;
    }
    return diffData;
  } catch (err) {
    if (!(err instanceof Error)) {
      err = new Error('' + err);
    }
    // Do our best effort to send back the file data if we've failed to
    // use it so that it doesn't have to be re-requested.
    (err as WithTransferable)[transferSymbol] = getTransfer(...data);
    // Re-throw.
    throw err;
  }
};

export const gitDiffFileMeta = async (
  name: string,
  data: GitDiffFileData,
): Promise<GitDiffMeta> => {
  const [leftMeta, rightMeta] = await Promise.all(
    data.map((x) => getFileType(name, x)),
  );
  const base = {
    left: leftMeta,
    right: rightMeta,
  };
  const allowed = Object.keys(gitDiffEngines).filter((key) => {
    return gitDiffEngines[key as keyof typeof gitDiffEngines].canUse(
      name,
      data,
      null,
      base,
    );
  });
  return {
    ...base,
    allowed,
    [transferSymbol]: getTransfer(...data),
  } as GitDiffMeta;
};

// Instantiate the worker. This method adds all the required Worker
// event listeners.
createWorker(self, {
  gitDiffFileMeta,
  gitDiff,
});
