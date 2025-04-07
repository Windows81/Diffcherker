import * as React from 'react';
import Page from 'components/new/page';
import Head from 'next/head';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomFamily, useAtomCallback } from 'jotai/utils';

import * as unzipit from 'unzipit';

import { GitDiff } from './GitDiff';
import { FileEntry, GitDiffType } from './types';
import { GitDiffWorkerPool } from './GitDiffWorkerPool';

interface GitDiffWebFile {
  name: string;
  left?: unzipit.ZipEntry | null | undefined;
  right?: unzipit.ZipEntry | null | undefined;
}

const filesAtomFamily = atomFamily((name: string) => {
  return atom<GitDiffWebFile>({
    name,
    left: null,
    right: null,
  });
});

const filesAtom = atom<FileEntry[]>([]);

const writeFilesAtom = atom(null, (_get, set, files: GitDiffWebFile[]) => {
  const entries = files.map((entry) => {
    set(filesAtomFamily(entry.name), entry);
    return {
      name: entry.name,
      sessionId: 'xxx',
      oldHex: entry.left ? 'xx' : null,
      newHex: entry.right ? 'xx' : null,
      oldSize: entry.left?.size ?? null,
      newSize: entry.right?.size ?? null,
      oldUrl: null,
      newUrl: null,
    };
  });
  set(filesAtom, entries);
});

/**
 * This is the entry component for GitDiff on the web.
 */
export const GitDiffViewWeb = () => {
  const [workerPool] = React.useState(() => new GitDiffWorkerPool());
  const writeFiles = useSetAtom(writeFilesAtom);
  const files = useAtomValue(filesAtom);

  const handleOpenDiff = React.useCallback(
    ({ file, diffType }: { file: FileEntry; diffType: GitDiffType | null }) => {
      alert(`open diff ${file.name} ${diffType}`);
    },
    [],
  );

  const handleLoadFileData = useAtomCallback(
    React.useCallback(
      async (
        get,
        _set,
        name: string,
      ): Promise<[Uint8Array | null, Uint8Array | null]> => {
        const fileAtom = filesAtomFamily(name);
        const file = get(fileAtom);
        if (!file) {
          throw new Error();
        }
        const parts = await Promise.all([
          file.left?.arrayBuffer(),
          file.right?.arrayBuffer(),
        ]);
        return parts.map((x) => (x ? new Uint8Array(x) : null)) as [
          Uint8Array | null,
          Uint8Array | null,
        ];
      },
      [],
    ),
  );

  const handleSubmit = React.useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault();
      const submit = async () => {
        const leftUrl =
          'https://corsproxy.io/?https://codeload.github.com/sarcasticadmin/empty-repo/zip/refs/heads/master';
        const rightUrl =
          'https://corsproxy.io/?https://codeload.github.com/izaakschroeder/auth-header/zip/refs/heads/master';
        const [leftZip, rightZip] = await Promise.all([
          unzipit.unzipRaw(leftUrl),
          unzipit.unzipRaw(rightUrl),
        ]);
        const files: Record<string, GitDiffWebFile> = {};
        const processFile = (
          side: 'left' | 'right',
          zip: unzipit.ZipInfoRaw,
        ) => {
          for (const entry of zip.entries) {
            if (entry.isDirectory) {
              continue;
            }
            const name = entry.name.replace(/^[^/]+\//, '');
            files[name] ??= { name, [side]: entry };
          }
        };

        processFile('left', leftZip);
        processFile('right', rightZip);

        writeFiles(Object.values(files));
      };
      submit();
    },
    [writeFiles],
  );

  return (
    <Page name="Git diff" fullWidth>
      <Head>
        <title>Git diff</title>
      </Head>
      <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
        <button type="submit">Diff ENGAGE!</button>
      </form>
      <GitDiff
        workerPool={workerPool}
        files={files}
        onLoadFileData={handleLoadFileData}
        onOpenDiff={handleOpenDiff}
      />
    </Page>
  );
};
