import { useState, useRef } from 'react';
import css from './diff-upload-header.module.css';
import FileDiffUploadButton, {
  FileUploadButtonProps,
} from '../file-diff-upload-button';
import DiffUploadButton from './diff-upload-button';
import MessageError from 'types/message-error';
import MessageBanner from 'components/shared/message-banner';
import { DiffInputType } from 'types/diff-input-type';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import dynamic from 'next/dynamic';

type DiffUploadHeaderMiniProps = FileUploadButtonProps & {
  uploadButtonLabel: string;
  error?: MessageError;
  isLoading?: boolean;
  customLoadingMessage?: string;
  uploadFromPath: (filePath: string, isFromRecentFile?: boolean) => void;
};

const DiffUploadHeaderMini: React.FC<DiffUploadHeaderMiniProps> = ({
  uploadButtonLabel,
  error,
  isLoading,
  customLoadingMessage: loadingMessage,
  uploadFromPath,
  ...rest
}) => {
  const { type } = rest;

  const [openRecentFileDropdown, setOpenRecentFileDropdown] = useState(false);
  const recentFileDropdownButtonRef = useRef<HTMLDivElement>(null);

  return (
    <div className={css.header}>
      <div className={css.fileSection}>
        {error ? (
          <MessageBanner error={error} size="xs" className={css.error} />
        ) : isLoading ? (
          <div className={css.loading}>
            <LoadingCircle size="xs" />
            <div className={css.loadingText}>
              {loadingMessage ||
                `Loading ${type === DiffInputType.FOLDER ? 'folder' : 'file'}...`}
            </div>
          </div>
        ) : (
          <FileDiffUploadButton {...rest} />
        )}
      </div>
      {!isLoading && (
        <>
          <div className={css.button}>
            {process.env.NEXT_PUBLIC_IS_ELECTRON && (
              <RecentFilesDropdownButton
                diffType={type}
                openDropdown={openRecentFileDropdown}
                setOpenDropdown={setOpenRecentFileDropdown}
                buttonRef={recentFileDropdownButtonRef}
              />
            )}
            <DiffUploadButton label={uploadButtonLabel} {...rest} />
          </div>
          {process.env.NEXT_PUBLIC_IS_ELECTRON && (
            <RecentFilesDropdownMenu
              isOpen={openRecentFileDropdown}
              diffType={type}
              onItemClick={(recentFile) => {
                uploadFromPath(recentFile.filePath, true);
              }}
              setOpen={setOpenRecentFileDropdown}
              buttonRef={recentFileDropdownButtonRef}
              variant="editHeaderMini"
            />
          )}
        </>
      )}
    </div>
  );
};

const RecentFilesDropdownButton = dynamic(
  () => import('components/new/recent-diffs/recent-files-dropdown-button'),
  {
    ssr: false,
  },
);

const RecentFilesDropdownMenu = dynamic(
  () => import('components/new/recent-diffs/recent-files-dropdown-menu'),
  {
    ssr: false,
  },
);

export default DiffUploadHeaderMini;
