import * as React from 'react';
import Page from 'components/new/page';
import Head from 'next/head';

import ipcEvents from '../../ipc-events';
import { GitDiff } from './GitDiff';
import { FileEntry, GitDiffType } from './types';
import { GitDiffWorkerPool } from './GitDiffWorkerPool';
import { useUrlParams } from 'lib/state/urlParams';
import { useTabOpen } from 'lib/state/tabs';
import dynamic from 'next/dynamic';

const AuthenticationWrapper = dynamic(
  async () => {
    return await import('components/new/authentication');
  },
  { ssr: false },
);

export const checkerPage: Record<GitDiffType, string> = {
  text: process.env.NODE_ENV === 'production' ? '' : 'index',
  image: 'image-compare',
  document: 'word-pdf-compare',
  spreadsheet: 'excel-compare',
};

/**
 * This is the entry component for GitDiff on the desktop. Ir has code
 * that interacts specifically with `ipcRenderer` that web does not
 * have available.
 */
export const GitDiffViewElectron = () => {
  const [filesMap, setFilesMap] = React.useState<Record<string, FileEntry>>({});
  const [workerPool] = React.useState(() => new GitDiffWorkerPool());
  const { sessionId } = useUrlParams();
  const openTab = useTabOpen();

  const handleOpenDiff = React.useCallback(
    ({ file, diffType }: { file: FileEntry; diffType: GitDiffType | null }) => {
      const pageName = checkerPage[diffType as keyof typeof checkerPage];
      if (typeof pageName !== 'string') {
        return;
      }
      const query = new URLSearchParams();
      query.set('origin', 'folder-diff');
      file.oldUrl && query.set('leftPath', file.oldUrl);
      file.newUrl && query.set('rightPath', file.newUrl);

      openTab({ href: `/${pageName}?${query.toString()}`, activate: true });
    },
    [openTab],
  );

  React.useEffect(() => {
    const handleFile = (_evt: unknown, payload: FileEntry) => {
      if (payload.sessionId !== sessionId) {
        return;
      }
      setFilesMap((old) => {
        return {
          ...old,
          [payload.name]: {
            ...old[payload.name],
            ...payload,
          },
        };
      });
    };

    // Register our handler for incoming files.
    window.ipcRenderer.on(ipcEvents.APP__GIT_DIFF_FILE, handleFile);
    // Start the session.
    window.ipcRenderer.send(ipcEvents.APP__GIT_DIFF_START, { sessionId });

    return () => {
      window.ipcRenderer.removeListener(
        ipcEvents.APP__GIT_DIFF_FILE,
        handleFile,
      );
    };
  }, [sessionId]);

  const handleLoadFileData = React.useCallback(
    (name: string) => {
      return window.ipcRenderer.invoke(
        ipcEvents.APP__GIT_DIFF_FILE_DATA_REQUEST,
        {
          sessionId,
          name,
        },
      );
    },
    [sessionId],
  );

  const files = React.useMemo(() => {
    return Object.values(filesMap);
  }, [filesMap]);

  return (
    <Page name="Git diff" fullWidth>
      <AuthenticationWrapper>
        <Head>
          <title>Git diff</title>
        </Head>
        <GitDiff
          workerPool={workerPool}
          files={files}
          onLoadFileData={handleLoadFileData}
          onOpenDiff={handleOpenDiff}
        />
      </AuthenticationWrapper>
    </Page>
  );
};
