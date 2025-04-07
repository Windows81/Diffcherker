import Button from 'components/shared/button';
import Modal from 'components/shared/modal';
import { DiffInputType } from 'types/diff-input-type';
import Tracking from 'lib/tracking';

import css from './invalid-upload-modal.module.css';

const diffTitles: Record<DiffInputType, string> = {
  [DiffInputType.TEXT]: 'Text',
  [DiffInputType.PDF]: 'Word & PDF',
  [DiffInputType.IMAGE]: 'Image',
  [DiffInputType.EXCEL]: 'Excel',
  [DiffInputType.FOLDER]: 'Folder',
};

const diffLinks: Record<DiffInputType, string> = {
  [DiffInputType.TEXT]: 'text-compare',
  [DiffInputType.PDF]: 'word-pdf-compare',
  [DiffInputType.IMAGE]: 'image-compare',
  [DiffInputType.EXCEL]: 'excel-compare',
  [DiffInputType.FOLDER]: 'folder-compare',
};

interface InvalidUploadModalProps {
  isOpen: boolean;
  closeModal: () => void;
  preferredDiffType: DiffInputType;
  currentDiffType: DiffInputType;
  showNonRedirectError?: boolean;
}

const InvalidUploadModal: React.FC<InvalidUploadModalProps> = ({
  isOpen,
  closeModal,
  preferredDiffType,
  currentDiffType,
  showNonRedirectError = true,
}) => {
  const redirectCase = preferredDiffType !== currentDiffType;
  const currentDiffTitle = diffTitles[currentDiffType];
  const preferedDiffTitle = diffTitles[preferredDiffType];

  if (!redirectCase && !showNonRedirectError) {
    return;
  }

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title="Error uploading file">
      <div className={css.content}>
        {redirectCase ? (
          <>
            <span>
              <em>{currentDiffTitle} compare</em> does not support this file
              type. Please use <em>{preferedDiffTitle} compare</em>.
            </span>
            <Button
              style="primary"
              tone="green"
              nextLink
              prefetch={false}
              href={`/${diffLinks[preferredDiffType]}/`}
              fullWidth
              size="large"
              onClick={() =>
                Tracking.trackEvent('Clicked invalid upload type redirect', {
                  currentDiffType,
                  preferredDiffType,
                })
              }
            >
              Continue to {preferedDiffTitle} compare
            </Button>
          </>
        ) : (
          <>
            Diffchecker does not support the uploaded file type.
            <Button
              style="secondary"
              tone="base"
              onClick={closeModal}
              fullWidth
              size="large"
            >
              Continue
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default InvalidUploadModal;
