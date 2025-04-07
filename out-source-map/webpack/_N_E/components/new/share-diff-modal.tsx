import * as DiffActions from 'redux/modules/diff-module';
import { isRejected } from '@reduxjs/toolkit';
import Button from 'components/shared/button';
import Icon from 'components/shared/icon';
import CancelCircleSvg from 'components/shared/icons/cancel-circle.svg';
import TimeSvg from 'components/shared/icons/time.svg';
import Modal from 'components/shared/modal';
import checkDiffOwnership from 'lib/check-diff-ownership';
import createWebUrl from 'lib/create-web-url';
import getDiffTitle from 'lib/get-diff-title';
import Tracking from 'lib/tracking';
import { useEffect, useRef, useState } from 'react';
import { getDiff } from 'redux/selectors/diff-selector';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';

import CopyReadonly from './copy-readonly';
import TextInput from '../shared/form/text-input';
import css from './share-diff-modal.module.css';
import { intlFormat } from 'date-fns';

export enum DiffPermission {
  VIEW = 'view',
  COMMENT = 'comment',
}

interface ShareDiffModalProps {
  isOpen: boolean;
  closeModal: (saved?: boolean) => void;
}

const ShareDiffModal: React.FC<ShareDiffModalProps> = ({
  isOpen,
  closeModal,
}) => {
  const collaboratorInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const currentDiff = useAppSelector(getDiff);
  const secretDiffs = useAppSelector((state) => state.user.secretDiffs);
  const [triedToSetPrivate, setTriedToSetPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // TODO: proper error handling from backend + disallow adding self?

  const [isPrivate, setIsPrivate] = useState(false);
  const [permission, setPermission] = useState<DiffPermission>(
    DiffPermission.VIEW,
  );
  const collaborators = currentDiff.collaborators || [];

  const { user } = useAppSelector((state) => state.user);
  const isPro = useAppSelector(isProUser);

  const diffTitle = getDiffTitle(currentDiff);
  const isOwner = checkDiffOwnership({ user, diff: currentDiff, secretDiffs });

  const { slug } = currentDiff;
  const url = createWebUrl(`/${slug}/`);

  useEffect(() => {
    setIsPrivate(currentDiff.isPrivate || false);
  }, [currentDiff.isPrivate]);

  useEffect(() => {
    setPermission(currentDiff.permission || DiffPermission.VIEW);
  }, [currentDiff.permission]);

  const setDiffPrivacy = (changeToPrivate: boolean) => {
    if (isLoading) {
      return;
    }

    if (isPro && isOwner) {
      setErrorMessage('');
      setIsPrivate(changeToPrivate);
      dispatch(
        DiffActions.patchSharing({
          slug,
          isPrivate: changeToPrivate,
          permission,
          collaborators,
        }),
      );
    } else {
      setTriedToSetPrivate(changeToPrivate);
    }
  };

  const setDiffPermission = (diffPermission: DiffPermission) => {
    if (isLoading) {
      return;
    }

    setErrorMessage('');
    setPermission(diffPermission);
    dispatch(
      DiffActions.patchSharing({
        slug,
        isPrivate: isPrivate,
        permission: diffPermission,
        collaborators,
      }),
    );
  };

  const addCollaborator = async (ev: React.FormEvent) => {
    void ev.preventDefault();

    const collaboratorToAdd = collaboratorInputRef.current?.value.toLowerCase();

    if (!collaboratorToAdd) {
      setErrorMessage('Please enter a valid email.');
      return;
    }

    if (collaborators.includes(collaboratorToAdd)) {
      setErrorMessage('Collaborator already added.');
      return;
    }

    const newCollaborators = [...collaborators, collaboratorToAdd];
    setIsLoading(true);
    const diffPatchResult = await dispatch(
      DiffActions.patchSharing({
        slug,
        isPrivate,
        permission,
        collaborators: newCollaborators,
      }),
    );
    setIsLoading(false);
    if (isRejected(diffPatchResult)) {
      setErrorMessage(
        'Something went wrong. Please check if the email is valid.',
      );
    } else {
      setErrorMessage('');
      collaboratorInputRef.current && (collaboratorInputRef.current.value = '');
    }
  };

  const removeCollaborator = (collaboratorToRemove: string) => {
    const newCollaborators = collaborators.filter(
      (email) => email !== collaboratorToRemove,
    );
    setErrorMessage('');
    dispatch(
      DiffActions.patchSharing({
        slug,
        isPrivate,
        permission,
        collaborators: newCollaborators,
      }),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        closeModal();
        setIsLoading(false);
        setTriedToSetPrivate(false);
        setErrorMessage('');
      }}
      title={`Share "${diffTitle}"`}
    >
      <div className={css.container}>
        {isOwner ? (
          <>
            <div className={css.shareDiffOption}>
              <h3 className="section-title">Access</h3>
              <label className={css.label} htmlFor="public-set">
                <div className={css.privacy}>
                  <input
                    type="radio"
                    name="privacy-setting"
                    value="public"
                    id="public-set"
                    checked={!isPrivate}
                    readOnly
                    onClick={() => setDiffPrivacy(false)}
                  />
                  <span>Anyone with the link</span>
                </div>
              </label>

              <label className={css.label} htmlFor="private-set">
                <div className={css.privacy}>
                  <input
                    type="radio"
                    name="privacy-setting"
                    value="private"
                    id="private-set"
                    checked={isPrivate}
                    readOnly
                    onClick={() => setDiffPrivacy(true)}
                  />
                  <span>Only invited people</span>
                </div>
              </label>
            </div>
            <div className={css.shareDiffOption}>
              <h3 className="section-title">Permission</h3>
              <label className={css.label} htmlFor="permission-comment">
                <div className={css.privacy}>
                  <input
                    type="radio"
                    name="permission-setting"
                    value="comment"
                    id="permission-comment"
                    checked={permission === DiffPermission.COMMENT}
                    readOnly
                    onClick={() => setDiffPermission(DiffPermission.COMMENT)}
                  />
                  <span>Can view and comment</span>
                </div>
              </label>

              <label className={css.label} htmlFor="permission-view">
                <div className={css.privacy}>
                  <input
                    type="radio"
                    name="permission-view"
                    value="view"
                    id="permission-view"
                    checked={permission === DiffPermission.VIEW}
                    readOnly
                    onClick={() => setDiffPermission(DiffPermission.VIEW)}
                  />
                  <span>Can view only</span>
                </div>
              </label>
            </div>
          </>
        ) : (
          <div className={css.description}>
            {!isPrivate
              ? 'Anyone with the link below will be able to view and duplicate the diff'
              : 'Only people authenticated with the right email address will be able to access the diff using the link below'}
          </div>
        )}

        {isPrivate && isPro && isOwner && (
          <div className={css.private}>
            {errorMessage && <div className={css.error}>{errorMessage}</div>}
            <form
              className={css.addCollaborator}
              onSubmit={(ev) => {
                if (!isLoading) {
                  void addCollaborator(ev);
                }
              }}
            >
              <TextInput
                ref={collaboratorInputRef}
                placeholder="example@email.com"
              />
              <Button
                type="submit"
                style="primary"
                tone="green"
                size="large"
                isLoading={isLoading}
              >
                Add
              </Button>
            </form>
            <div className={css.collaborators}>
              <div className={css.collaborator}>
                <div className={css.left}>{user?.email}</div>
                <div className={css.right}>You</div>
              </div>
              {collaborators.map((email) => (
                <div className={css.collaborator} key={email}>
                  <div className={css.left}>{email}</div>
                  <div className={css.right}>
                    <Button
                      style="clean"
                      className={css.remove}
                      onClick={() => removeCollaborator(email)}
                    >
                      <Icon svg={CancelCircleSvg} size="small" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {triedToSetPrivate && (
          <div className={css.getPro}>
            Private diffs are a Diffchecker Pro feature.
            <Button
              style="primary"
              tone="green"
              size="large"
              href="/pricing"
              nextLink
              onClick={() => {
                Tracking.trackEvent('Clicked get diffchecker', {
                  type: 'pricing',
                  position: 'share-diff-modal',
                });
              }}
            >
              Get Diffchecker Pro
            </Button>
          </div>
        )}

        <div className={css.about}>
          <CopyReadonly value={url} />

          {currentDiff.expires && (
            <div className={css.expiry}>
              <div className={css.alertIcon}>
                <Icon size="small" svg={TimeSvg} />
              </div>
              <div className={css.alertText}>
                This diff will expire{' '}
                {intlFormat(new Date(currentDiff.expires), {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={css.footer}>
        <Button
          style="primary"
          tone="green"
          size="large"
          fullWidth
          onClick={() => closeModal()}
          data-testid="share-diff-modal-done-button"
        >
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default ShareDiffModal;
