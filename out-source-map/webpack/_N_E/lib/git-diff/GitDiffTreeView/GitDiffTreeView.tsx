import * as React from 'react';
import { FileEntry } from '../types';
import { GitDiffFileAtomFamily } from '../gitDiffFileAtomFamily';
import SearchIcon from 'web/components/shared/icons/search.svg';
import { GitDiffTreeSlice } from './GitDiffTreeSlice';
import { buildTree } from './buildTree';
import { filterTree } from './filterTree';

import css from './GitDiffTreeView.module.css';
import TextInput from 'components/shared/form/text-input';
import Icon from 'components/shared/icon';
import { useRouter } from 'next/router';

interface GitDiffTreeViewProps {
  loading: boolean;
  files: FileEntry[];
  fileAtomFamily: GitDiffFileAtomFamily;
  onClickFile?: (file: FileEntry) => void;
}

export const GitDiffTreeView: React.FC<GitDiffTreeViewProps> = ({
  files,
  fileAtomFamily,
  onClickFile,
}) => {
  const router = useRouter();

  // TODO this var is a little sketchy since it causes the entire tree to re-render everytime
  //      a user clicks on a node. This is done to calculate active state changes.
  //      It might be inevitable for styling active states, but I feel we might be able to do better.
  const pageFragment = React.useMemo(() => {
    const hashIndex = router.asPath.indexOf('#');
    return hashIndex !== -1 ? router.asPath.slice(hashIndex + 1) : '';
  }, [router.asPath]);

  const tree = React.useMemo(() => {
    return buildTree(files);
  }, [files]);
  const [search, setSearch] = React.useState('');
  const handleSearchChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(ev.target.value);
    },
    [setSearch],
  );

  const filteredTree = React.useMemo(() => {
    return search ? filterTree(search, tree) : tree;
  }, [tree, search]);

  return (
    <div>
      <div className={css.gitDiffTreeSearchBar}>
        <TextInput
          placeholder="Search"
          type="text"
          autoComplete="off"
          value={search}
          onChange={handleSearchChange}
        />
        <Icon svg={SearchIcon} size="small" />
      </div>

      <div className={css.gitDiffTreeContainer} role="tree">
        <GitDiffTreeSlice
          fileAtomFamily={fileAtomFamily}
          onClickFile={onClickFile}
          tree={filteredTree}
          level={0}
          pageFragment={pageFragment}
        />
      </div>
    </div>
  );
};
