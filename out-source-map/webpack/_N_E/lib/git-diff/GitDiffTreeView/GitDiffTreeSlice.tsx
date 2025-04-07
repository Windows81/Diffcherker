import * as React from 'react';
import classNames from 'classnames';
import { useAtomValue } from 'jotai';
import { LoadingSpinner } from '../base';
import FileIcon from 'web/components/shared/icons/document-text.svg';
import ImageIcon from 'web/components/shared/icons/image.svg';
import ChevronRightIcon from 'web/components/shared/icons/chevron-right.svg';
import PlusCircleIcon from 'web/components/shared/icons/plus-circle.svg';
import MinusCircleIcon from 'web/components/shared/icons/minus-circle.svg';
import EditCircleIcon from 'web/components/shared/icons/edit-circle.svg';
import MoveCircleIcon from 'web/components/shared/icons/move-circle.svg';
import { FileEntry, GitDiffType } from '../types';
import css from './GitDiffTreeSlice.module.css';
import { GitDiffFileAtomFamily } from '../gitDiffFileAtomFamily';
import Link from 'next/link';
import { getGitDiffStatus } from '../getFileStatus';
import Icon from 'components/shared/icon';

export interface GitDiffTreeSliceProps {
  onClickFile?: (file: FileEntry) => void;
  label?: string | null;
  file?: FileEntry;
  tree: GitDiffTreeSliceProps[];
  level: number;
  fileAtomFamily: GitDiffFileAtomFamily;
  pageFragment?: string;
}

export const GitDiffTreeSlice: React.FC<GitDiffTreeSliceProps> = ({
  label,
  file,
  tree,
  level,
  onClickFile,
  fileAtomFamily,
  pageFragment,
}) => {
  const fileAtom = fileAtomFamily(file?.name ?? '$$$');
  const { loadingAtom, diffTypeAtom } = useAtomValue(fileAtom);
  const loading = useAtomValue(loadingAtom);
  const diffType = useAtomValue(diffTypeAtom);
  const [open, setOpen] = React.useState(true);
  const handleClick = React.useCallback(
    (ev: React.MouseEvent<HTMLAnchorElement>) => {
      if (file && onClickFile) {
        onClickFile(file);
      }
      if (tree) {
        ev.preventDefault();
        setOpen((old) => !old);
      }
    },
    [setOpen, tree, onClickFile, file],
  );

  // each level of nesting adds x pixels of padding
  // ...except the 1st level which stays constant
  const margin = level > 1 ? level * 12 : 8;

  const status = file ? getGitDiffStatus(file) : null;

  const statusIcon = React.useMemo(() => {
    if (!status) {
      return null;
    }
    if (status === 'edit') {
      return <Icon svg={EditCircleIcon} size="small" />;
    }
    if (status === 'add') {
      return <Icon svg={PlusCircleIcon} size="small" />;
    }
    if (status === 'remove') {
      return <Icon svg={MinusCircleIcon} size="small" />;
    }
    if (status === 'rename') {
      return <Icon svg={MoveCircleIcon} size="small" />;
    }

    return null;
  }, [status]);

  const subtree = React.useMemo(() => {
    return (
      open &&
      tree && (
        <ul>
          {tree.map((child) => {
            return (
              <li key={child.label}>
                <GitDiffTreeSlice
                  {...child}
                  level={level + 1}
                  onClickFile={onClickFile}
                  fileAtomFamily={fileAtomFamily}
                  pageFragment={pageFragment}
                />
              </li>
            );
          })}
        </ul>
      )
    );
  }, [tree, open, level, onClickFile, fileAtomFamily, pageFragment]);

  // TODO make this return an iconSvg and just use single icon component in jsx
  const icon = React.useMemo(() => {
    if (tree) {
      return null;
    }

    if (loading) {
      return (
        <div className={css.loadingContainer}>
          <LoadingSpinner />
        </div>
      );
    }

    if (diffType === GitDiffType.image) {
      return (
        <Icon svg={ImageIcon} size="small" className={css.gitDiffTreeIcon} />
      );
    }

    return <Icon svg={FileIcon} size="small" className={css.gitDiffTreeIcon} />;
  }, [tree, loading, diffType]);

  if (!label) {
    return subtree;
  }

  return (
    <div
      aria-expanded={open ? 'true' : 'false'}
      aria-level={level}
      role="treeitem"
      aria-selected={false}
    >
      <Link
        className={classNames(css.gitDiffTreeLink, {
          [css.gitDiffTreeEditStatus]: status === 'edit',
          [css.gitDiffTreeAddStatus]: status === 'add',
          [css.gitDiffTreeRemoveStatus]: status === 'remove',
          [css.gitDiffTreeRenameStatus]: status === 'rename',
          [css.gitDiffTreeActive]: file && pageFragment === file.name,
        })}
        style={{ paddingLeft: margin }}
        onClick={handleClick}
        href={`#${file?.name}`}
      >
        <div className={css.gitDiffTreeLinkIconFileContainer}>
          {tree && (
            <Icon
              svg={ChevronRightIcon}
              size="small"
              className={classNames(
                css.gitDiffTreeChevron,
                open && css.gitDiffTreeChevronDown,
              )}
            />
          )}
          {icon}
          <span title={file?.name} className={css.gitDiffTreeName}>
            {label}
          </span>
        </div>
        {statusIcon}
      </Link>

      {subtree}
    </div>
  );
};
