import { useState, useEffect, useRef } from 'react';
import FileItem from '../recent-diffs/file-item';
import {
  getRecentFiles,
  deleteRecentFile,
  RecentFile,
} from '../recent-diffs/commands/recent-diff-utils';
import * as electron from 'lib/state/electron';
import { DiffInputType } from 'types/diff-input-type';

import CancelSVG from 'components/shared/icons/cancel.svg';
import Icon from 'components/shared/icon';

import css from './recent-files-dropdown-menu.module.css';
import cx from 'classnames';

const RecentFilesDropdownMenu = ({
  isOpen,
  setOpen,
  diffType,
  onItemClick,
  buttonRef,
  variant = 'custom',
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  diffType: DiffInputType;
  onItemClick: (file: RecentFile) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
  variant:
    | 'textDiff'
    | 'dropzone'
    | 'editHeader'
    | 'editHeaderMini'
    | 'editHeaderFolder'
    | 'custom';
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const files = getRecentFiles();
    let filteredFiles = files.filter((file) => file.diffType === diffType);
    setRecentFiles(filteredFiles);

    electron.storeSubscribe('recent.files', (files) => {
      filteredFiles = (files as RecentFile[]).filter(
        (file) => file.diffType === diffType,
      );
      setRecentFiles(filteredFiles);
    });
  }, [diffType, setRecentFiles]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        !dropdownRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [setOpen, buttonRef]);

  const handleFileClick = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>,
    file: RecentFile,
  ) => {
    onItemClick(file);
    setOpen(false);
    event.stopPropagation();
    event.preventDefault();
  };

  if (!isOpen) {
    return null;
  }

  const isEmpty = recentFiles.length == 0;

  const handleDeleteClick = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>,
    filePath: string,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    deleteRecentFile(filePath, diffType);
  };

  return (
    <div
      className={cx(
        css.menu,
        css[variant],
        isEmpty && variant == 'dropzone' && css.narrow,
      )}
      ref={dropdownRef}
    >
      {isEmpty ? (
        <div className={css.empty}>No recent files</div>
      ) : (
        recentFiles.map((file) => {
          return (
            <div
              className={css.file}
              onClick={(event) => handleFileClick(event, file)}
              key={file.filePath}
              onKeyDown={(e) => e.key === 'Enter' && handleFileClick(e, file)}
              role="button"
              tabIndex={0}
            >
              <FileItem
                name={file.fileName}
                filePath={file.filePath}
                diffType={file.diffType}
                size="small"
              />
              <div
                className={css.cancelContainer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteClick(e, file.filePath);
                  }
                }}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  handleDeleteClick(e, file.filePath);
                }}
              >
                <Icon svg={CancelSVG} size="small" />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default RecentFilesDropdownMenu;
