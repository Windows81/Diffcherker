import { useRef, useState } from 'react';
import { RecentFile } from './commands/recent-diff-utils';
import { DiffInputType } from 'types/diff-input-type';
import RecentFilesDropdownMenu from './recent-files-dropdown-menu';
import RecentFilesDropdownButton from './recent-files-dropdown-button';

interface RecentFilesDropdownProps {
  type: DiffInputType;
  handleUploadFromPath: (filePath: string) => void;
}

const RecentFilesDropdown = ({
  type,
  handleUploadFromPath,
}: RecentFilesDropdownProps) => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const handleItemClick = (recentFile: RecentFile) => {
    const filePath = recentFile.filePath;
    handleUploadFromPath(filePath);
  };

  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <RecentFilesDropdownButton
        diffType={type}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        buttonRef={buttonRef}
        isDropzone={true}
      />
      <RecentFilesDropdownMenu
        isOpen={openDropdown}
        diffType={type}
        onItemClick={handleItemClick}
        setOpen={setOpenDropdown}
        buttonRef={buttonRef}
        variant="dropzone"
      />
    </>
  );
};

export default RecentFilesDropdown;
