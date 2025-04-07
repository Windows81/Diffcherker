import * as DiffActions from 'redux/modules/diff-module';
import Button from 'components/shared/button';
import Modal from 'components/shared/modal';
import getDiffTitle from 'lib/get-diff-title';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from 'redux/store';

import css from './delete-diff-modal.module.css';
import { t } from 'lib/react-tiny-i18n';

interface DeleteDiffModalProps {
  isOpen: boolean;
  closeModal: () => void;
  title?: string;
  slug: string;
}

const DeleteDiffModal: React.FC<DeleteDiffModalProps> = ({
  isOpen,
  closeModal,
  title,
  slug,
}) => {
  const diffTitle = getDiffTitle({ title, slug });
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentSecretDiffs = useAppSelector((state) => state.user.secretDiffs);
  const isLoggedIn = useAppSelector((state) => state.user.user) !== undefined;
  const relevantSecretDiff = currentSecretDiffs.find((diff) => {
    return diff.slug === slug;
  });

  const deleteCurrentDiff = () => {
    if (relevantSecretDiff !== undefined) {
      dispatch(
        DiffActions.deleteSecretDiff({
          secretKey: relevantSecretDiff.secretKey,
          slug: relevantSecretDiff.slug,
        }),
      );
      Tracking.trackEvent('Deleted diff');
      closeModal();
      void router.push('/');
    } else if (isLoggedIn && slug !== undefined) {
      dispatch(DiffActions.deleteDiff({ slug }));
      Tracking.trackEvent('Deleted diff');
      closeModal();
      void router.push('/');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      closeModal={closeModal}
      title={`Are you sure you want to delete "${diffTitle}"?`}
    >
      <div className={css.content}>
        This cannot be undone.
        <div className={css.buttons}>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={closeModal}
          >
            {t('Diff.cancel')}
          </Button>
          <Button
            style="primary"
            tone="red"
            size="large"
            onClick={deleteCurrentDiff}
            fullWidth
          >
            {t('SaveDiffModal.deleteDiff')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteDiffModal;
