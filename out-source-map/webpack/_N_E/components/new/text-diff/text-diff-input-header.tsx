import css from './text-diff-input-header.module.css';
import TextDiffUploadButton, {
  TextDiffUploadButtonProps,
} from './text-diff-upload-button';
import { DiffInputType } from 'types/diff-input-type';

import dynamic from 'next/dynamic';

interface TextDiffInputHeaderProps extends TextDiffUploadButtonProps {
  openDropdown: boolean;
  setOpenDropdown: (open: boolean) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
}

const TextDiffInputHeader: React.FC<TextDiffInputHeaderProps> = (props) => {
  const { openDropdown, setOpenDropdown, buttonRef } = props;
  const labelFor = props.side ? `diff-input-${props.side}` : undefined;

  return (
    <div className={css.container}>
      <label htmlFor={labelFor} className={css.headerLabel}>
        {props.label}
      </label>
      {process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <RecentFilesDropdownButton
          diffType={DiffInputType.TEXT}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          buttonRef={buttonRef}
        />
      )}
      <TextDiffUploadButton {...props} />
    </div>
  );
};

const RecentFilesDropdownButton = dynamic(
  () => import('components/new/recent-diffs/recent-files-dropdown-button'),
  {
    ssr: false,
  },
);

export default TextDiffInputHeader;
