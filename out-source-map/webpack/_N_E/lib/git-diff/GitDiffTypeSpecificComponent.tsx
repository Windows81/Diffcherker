import { useAtomValue } from 'jotai';
import { FileEntry, GitDiffType } from './types';
import { GitDiffTextEntry } from './diff-types/text/GitDiffTextEntry';
import { GitDiffImageEntry } from './diff-types/image/GitDiffImageEntry';
import { GitDiffFileAtom } from './gitDiffFileAtomFamily';
import { GitDiffDataProps } from './GitDiffDataProps';
import { GitDiffEntryInfo } from './GitDiffEntryInfo';
import { getGitDiffStatus } from './getFileStatus';
import { TextDiffOutputSettingsObject } from 'components/new/text-diff-output/settings';
import { useMemo } from 'react';
type DiffComponents = {
  [K in GitDiffType]: Record<string, React.FC<GitDiffDataProps<K>>>;
};

const diffComponents: DiffComponents = {
  [GitDiffType.text]: {
    header: () => null,
    body: GitDiffTextEntry,
    settings: () => null,
  },
  [GitDiffType.image]: {
    header: () => null,
    body: GitDiffImageEntry,
    settings: () => null,
  },
  [GitDiffType.document]: {
    header: () => null,
    body: () => <GitDiffEntryInfo message="Unsupported diff type" />,
    settings: () => null,
  },

  [GitDiffType.spreadsheet]: {
    header: () => null,
    body: () => <GitDiffEntryInfo message="Unsupported diff type" />,
    settings: () => null,
  },
};

interface GitDiffTypeSpecificComponentProps {
  file: FileEntry;
  fileAtom: GitDiffFileAtom;
  component: 'header' | 'body' | 'settings';
  sharedTextSettings: TextDiffOutputSettingsObject;
}

// TODO look into adjusting abstraction, decomposition may help simplify things here (separate header, body, settings components?)
export const GitDiffTypeSpecificComponent: React.FC<
  GitDiffTypeSpecificComponentProps
> = ({ file, fileAtom, component, sharedTextSettings }) => {
  const { diffTypeAtom, diffAtomFamily } = useAtomValue(fileAtom);
  const diffType = useAtomValue(diffTypeAtom);

  return useMemo(() => {
    if (!diffType) {
      // if diff type doesn't exist that implies file could be loading
      // just show nothing for now
      return null;
    }
    const diffAtom = diffAtomFamily(diffType);

    const diffStatus = getGitDiffStatus(file);
    if (component === 'body' && diffStatus === 'rename') {
      return <GitDiffEntryInfo message="File was renamed but not changed" />;
    }

    if (component === 'body' && file.oldHex === file.newHex) {
      return <GitDiffEntryInfo message="No changes to show" />;
    }

    const Component: React.FC<GitDiffDataProps<GitDiffType>> =
      diffComponents[diffType][component];
    return (
      <Component
        file={file}
        fileAtom={fileAtom}
        diffAtom={diffAtom}
        sharedTextSettings={sharedTextSettings}
      />
    );
  }, [diffType, file, fileAtom, diffAtomFamily, component, sharedTextSettings]);
};
