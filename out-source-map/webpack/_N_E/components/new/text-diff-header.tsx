import Button from 'components/shared/button';
import Dropdown from 'components/shared/dropdown';
import EllipsisVerticalSvg from 'components/shared/icons/ellipsis-vertical.svg';
import SaveSvg from 'components/shared/icons/save.svg';
import ShareSvg from 'components/shared/icons/share.svg';
import checkDiffOwnership from 'lib/check-diff-ownership';
import getDiffTitle from 'lib/get-diff-title';
import { t } from 'lib/react-tiny-i18n';
import formatter from 'lib/timeago-formatter';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useState } from 'react';
import TimeAgo from 'react-timeago';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppSelector } from 'redux/store';
import { type Diff } from 'types/diff';
import cx from 'classnames';
import DeleteDiffModal from './delete-diff-modal';
import css from './text-diff-header.module.css';
import ipcEvents from 'ipc-events';
import { DiffInputType } from 'types/diff-input-type';

interface TextDiffHeaderProps {
  title?: string;
  slug?: string;
  createdAt?: Diff['createdAt'];
  expires?: Diff['expires'];
  openShareModal?: () => void;
  openSaveModal?: () => void;
  openSaveModalToDuplicate?: () => void;
}

const TextDiffHeader: React.FC<TextDiffHeaderProps> = ({
  title,
  slug,
  createdAt,
  expires,
  openShareModal = () => {
    /* noop */
  },
  openSaveModal = () => {
    /* noop */
  },
  openSaveModalToDuplicate = () => {
    /* noop */
  },
}) => {
  const router = useRouter();
  const currentDiff = useAppSelector(getDiff);
  const diffTitle = getDiffTitle({ title, slug });
  const isSavedDiff = !!slug;

  const clearDiff = () => {
    Tracking.trackEvent('Clicked diff button', { diffButton: 'clear' });
    void router.push('/');
  };

  const handleSaveFile = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    const contentToSave = { version: 1, diff: currentDiff };
    const fileContent = JSON.stringify(contentToSave);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      await window.ipcRenderer.invoke(ipcEvents.APP__EXPORT_TO_FILE, {
        fileContent,
      });
      Tracking.trackEvent('Exported diff', {
        diffInputType: DiffInputType.TEXT,
        fileType: 'diffchecker',
      });
    }
  };

  return (
    <div className={css.wrapper}>
      <header className={css.diffHeader}>
        {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <h2
            className={cx(css.headerTitle, { [css.unsavedDiff]: !isSavedDiff })}
          >
            <span>{diffTitle}</span>
          </h2>
        )}
        {!!(createdAt || expires) && (
          <div className={css.timestamps}>
            <span className={css.creation}>
              {!!createdAt && (
                <>
                  Created <TimeAgo date={createdAt} formatter={formatter} />
                </>
              )}
            </span>
            <span className={css.expiry}>
              {expires ? (
                <>
                  Diff expires in{' '}
                  <TimeAgo date={expires} formatter={formatter} />
                </>
              ) : (
                'Diff never expires'
              )}
            </span>
          </div>
        )}
        <div className={css.headerButtons}>
          {isSavedDiff && (
            <SavedDiffDropdown
              openDuplicateModal={openSaveModalToDuplicate}
              title={title}
              slug={slug}
            />
          )}
          <div className={css.buttonsWithoutDropdown}>
            <Button style="secondary" tone="base" onClick={clearDiff}>
              {t('DiffEditorHeader.clear')}
            </Button>
            {process.env.NEXT_PUBLIC_IS_ELECTRON ? (
              <Button
                iconStartSvg={SaveSvg}
                style="primary"
                tone="base"
                onClick={handleSaveFile}
              >
                Save as a file
              </Button>
            ) : (
              <>
                {!isSavedDiff && (
                  <Button
                    iconStartSvg={SaveSvg}
                    style="primary"
                    tone="base"
                    onClick={openSaveModal}
                    data-testid="save-text-diff-button"
                  >
                    {t('SaveDiffModal.save')}
                  </Button>
                )}
                <Button
                  iconStartSvg={ShareSvg}
                  style="primary"
                  tone="green"
                  onClick={openShareModal}
                  data-testid="share-text-diff-button"
                >
                  {t('DiffEditorHeader.share')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

interface SavedDiffDropdownProps {
  openDuplicateModal: () => void;
  title?: string;
  slug: string;
}

const SavedDiffDropdown: React.FC<SavedDiffDropdownProps> = ({
  openDuplicateModal,
  title,
  slug,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const secretDiffs = useAppSelector((state) => state.user.secretDiffs);
  const user = useAppSelector((state) => state.user.user);
  const currentDiff = useAppSelector(getDiff);
  const isOwner = checkDiffOwnership({ user, diff: currentDiff, secretDiffs });

  const openDropdown = () => {
    Tracking.trackEvent('Clicked diff button', {
      diffButton: 'diff-header-dropdown',
    });
  };

  const openDeleteModal = () => {
    Tracking.trackEvent('Clicked diff button', { diffButton: 'delete' });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className={css.savedDiffDropdown}>
      <Dropdown
        rightAlign
        isOpen={isDropdownOpen}
        setIsOpen={setIsDropdownOpen}
        onOpen={openDropdown}
        display={EllipsisVerticalSvg}
        onChange={(option) => option.onClick()}
        options={[
          {
            label: t('TextDiff.duplicate'),
            value: 'duplicate',
            onClick: openDuplicateModal,
          },
          ...(isOwner
            ? [
                {
                  label: t('SaveDiffModal.deleteDiff'),
                  value: 'delete',
                  tone: 'red',
                  onClick: openDeleteModal,
                },
              ]
            : []),
        ]}
      />
      <DeleteDiffModal
        isOpen={isDeleteModalOpen}
        closeModal={closeDeleteModal}
        title={title}
        slug={slug}
      />
    </div>
  );
};

export default TextDiffHeader;
