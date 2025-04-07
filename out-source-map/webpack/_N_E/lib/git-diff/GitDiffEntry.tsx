import * as React from 'react';
import classNames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import CheckIcon from 'web/components/shared/icons/ok.svg';
import CopyIcon from 'web/components/shared/icons/duplicate.svg';
import ChevronRightIcon from 'web/components/shared/icons/chevron-right.svg';
import PlusCircleIcon from 'web/components/shared/icons/plus-circle.svg';
import MinusCircleIcon from 'web/components/shared/icons/minus-circle.svg';
import EditCircleIcon from 'web/components/shared/icons/edit-circle.svg';
import ExternalLinkIcon from 'web/components/shared/icons/external-link.svg';
import MoveCircleIcon from 'web/components/shared/icons/move-circle.svg';
import ArrowRightIcon from 'web/components/shared/icons/arrow-right.svg';
import { FileEntry, GitDiffType } from './types';

import { GitDiffFileAtom } from './gitDiffFileAtomFamily';
import { GitDiffTypeSpecificComponent } from './GitDiffTypeSpecificComponent';

import css from './GitDiffEntry.module.css';
import { getGitDiffStatus } from './getFileStatus';
import { Button } from './base/Button';
import SharedButton from 'web/components/shared/button';
import Icon from 'components/shared/icon';
import { TextDiffOutputSettingsObject } from 'components/new/text-diff-output/settings';

interface GitDiffEntryProps {
  file: FileEntry;
  fileAtom: GitDiffFileAtom;
  sharedTextSettings: TextDiffOutputSettingsObject;
  onOpenDiff: (options: { file: FileEntry; diffType: GitDiffType }) => void;
}

export const GitDiffEntry: React.FC<GitDiffEntryProps> = ({
  file,
  fileAtom,
  sharedTextSettings,
  onOpenDiff,
}) => {
  const { collapsedAtom, diffTypeAtom, loadFileMetaAtom } =
    useAtomValue(fileAtom);

  const [collapsed, setCollapsed] = useAtom(collapsedAtom);
  const loadFileMeta = useSetAtom(loadFileMetaAtom);
  const diffType = useAtomValue(diffTypeAtom);

  const { name, newName } = file;

  const [showCopied, setShowCopied] = React.useState(false);
  const copyTimerRef = React.useRef<NodeJS.Timeout | undefined>();

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const elementRef = React.useRef<HTMLAnchorElement | null>(null);

  React.useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);
  const handleCopy = React.useCallback(() => {
    clearTimeout(copyTimerRef.current);
    navigator.clipboard.writeText(newName ? newName : name);
    setShowCopied(true);
    copyTimerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2500);
  }, [name, newName]);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((old) => !old);
  }, [setCollapsed]);

  const handleOpenDiff = React.useCallback(() => {
    if (!diffType) {
      return;
    }
    onOpenDiff({ file, diffType });
  }, [diffType, file, onOpenDiff]);

  const gitDiffStatus = getGitDiffStatus(file);

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.length > 0 && entries[0].isIntersecting) {
          loadFileMeta();
          observerRef.current?.unobserve(entries[0].target);
        }
      },
      { rootMargin: '0px 0px 100% 0px' },
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observerRef.current?.unobserve(elementRef.current);
      }
    };
  }, [loadFileMeta]);

  return (
    <a
      ref={elementRef}
      id={file.name}
      className={css.gitDiffEntryContainer}
      aria-expanded={collapsed ? 'false' : 'true'}
    >
      <div className={css.gitDiffEntryHeader}>
        {/* TODO replace this with shared button component */}
        <Button
          className={css.gitDiffEntryHeaderButton}
          onClick={toggleCollapsed}
        >
          <Icon
            svg={ChevronRightIcon}
            className={classNames(
              css.gitDiffEntryChevron,
              !collapsed && css.gitDiffEntryChevronDown,
            )}
          />
        </Button>
        <GitDiffTypeSpecificComponent
          file={file}
          fileAtom={fileAtom}
          component="header"
          sharedTextSettings={sharedTextSettings}
        />
        <div
          className={classNames(css.gitDiffEntryHeaderNameContainer, {
            [css.gitDiffEntryEditStatus]: gitDiffStatus === 'edit',
            [css.gitDiffEntryAddStatus]: gitDiffStatus === 'add',
            [css.gitDiffEntryRemoveStatus]: gitDiffStatus === 'remove',
            [css.gitDiffEntryRenameStatus]: gitDiffStatus === 'rename',
          })}
        >
          {gitDiffStatus === 'edit' && (
            <Icon svg={EditCircleIcon} size="small" />
          )}
          {gitDiffStatus === 'add' && (
            <Icon svg={PlusCircleIcon} size="small" />
          )}
          {gitDiffStatus === 'remove' && (
            <Icon svg={MinusCircleIcon} size="small" />
          )}
          {gitDiffStatus === 'rename' && (
            <Icon svg={MoveCircleIcon} size="small" />
          )}
          {gitDiffStatus === 'rename' && newName ? (
            <div className={css.gitDiffEntryRenameHeader}>
              <div title={name} className={css.gitDiffEntryRenamePath}>
                <span className={css.gitDiffEntryRenamePathPrefix}>
                  {name.slice(0, name.lastIndexOf('/') + 1)}
                </span>
                <span className={css.gitDiffEntryRenamePathFilename}>
                  {name.split('/').pop()}
                </span>
              </div>
              <Icon svg={ArrowRightIcon} size="xs" />
              <div title={newName} className={css.gitDiffEntryRenamePath}>
                <span className={css.gitDiffEntryRenamePathPrefix}>
                  {newName.slice(0, newName.lastIndexOf('/') + 1)}
                </span>
                <span className={css.gitDiffEntryRenamePathFilename}>
                  {newName.split('/').pop()}
                </span>
              </div>
            </div>
          ) : (
            <div title={name} className={css.gitDiffEntryHeaderName}>
              {name}
            </div>
          )}
        </div>
        {/* TODO replace this with shared button component */}
        <Button disabled={showCopied} onClick={handleCopy}>
          {showCopied ? (
            <Icon
              svg={CheckIcon}
              className={css.gitDiffEntryCopyCheckIcon}
              size="small"
            />
          ) : (
            <Icon
              svg={CopyIcon}
              size="xs"
              className={css.gitDiffEntryCopyIcon}
            />
          )}
        </Button>
        <GitDiffTypeSpecificComponent
          file={file}
          fileAtom={fileAtom}
          component="settings"
          sharedTextSettings={sharedTextSettings}
        />
        <div style={{ flex: '1 1 auto' }} />

        <SharedButton style="text" tone="base" onClick={handleOpenDiff}>
          <div className={css.gitDiffEntryExternalLinkContent}>
            <Icon svg={ExternalLinkIcon} size="small" />
            <span>Open diff</span>
          </div>
        </SharedButton>
      </div>
      {collapsed ? null : (
        <div className={css.gitDiffBodyContainer}>
          <GitDiffTypeSpecificComponent
            file={file}
            fileAtom={fileAtom}
            component="body"
            sharedTextSettings={sharedTextSettings}
          />
        </div>
      )}
    </a>
  );
};
