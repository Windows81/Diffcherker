import * as DiffActions from 'redux/modules/diff-module';
import Button from 'components/shared/button';
import Modal from 'components/shared/modal';
import diffRouter from 'lib/diff-router';
import getDiffTitle from 'lib/get-diff-title';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { DiffInputType } from 'types/diff-input-type';

import Select from '../shared/form/select';
import TextInput from '../shared/form/text-input';
import css from './save-diff-modal.module.css';
import { captureException } from 'lib/sentry';
import { DiffPermission } from 'types/diff';
import { pageView } from 'lib/gtag';

interface SaveDiffModalProps {
  isOpen: boolean;
  closeModal: (saved?: boolean) => void;
  triedOpeningShareModal?: boolean;
  titleOverride?: string;
  explinationOverride?: string;
  defaultPermission?: DiffPermission;
}

const SaveDiffModal: React.FC<SaveDiffModalProps> = ({
  isOpen,
  closeModal,
  triedOpeningShareModal,
  titleOverride,
  explinationOverride,
  defaultPermission,
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const currentDiff = useAppSelector(getDiff);
  const { user, ip } = useAppSelector((state) => state.user);
  const diffLength = useAppSelector((state) => state.diff.diffs.length);
  const router = useRouter();

  const diffTitle = getDiffTitle(currentDiff);
  const isSavedDiff = !!currentDiff.slug;

  const saveDiff = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const title = inputRef.current?.value.trim() || '';
    const expiry = selectRef.current?.value || 'forever';
    setIsLoading(true);

    try {
      const response = await dispatch(
        DiffActions.storeDiff({
          ...currentDiff,
          user,
          expiry,
          title,
          ip,
          isPrivate: false,
          permission: defaultPermission ?? DiffPermission.VIEW,
        }),
      ).unwrap();
      setIsLoading(false);
      const slug = response.data.slug;
      Tracking.trackEvent('Created diff', {
        diffInputType: DiffInputType.TEXT,
        type: 'save',
        slug,
      });

      diffRouter.push(
        '/',
        `/${slug}/`,
        slug,
        diffLength,
        router.locale || 'en',
      );
      pageView(`/${slug}/`);

      Tracking.trackPage('Diff');
      closeModal(true);
      // TODO: make this cleaner. the reason we use this is because using the normal Router.pushState() method creates a second re-render.
    } catch (e) {
      setIsLoading(false);
      captureException(e);
      alert(
        'Error saving diff. Is your diff too large, or is your internet connection down?',
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        closeModal();
        setIsLoading(false);
      }}
      title={
        titleOverride ??
        (triedOpeningShareModal
          ? 'Save before you share it'
          : isSavedDiff
            ? 'Save as new diff'
            : 'Save diff')
      }
      initialFocusRef={inputRef}
    >
      <form
        className={css.text}
        onSubmit={(ev) => {
          if (!isLoading) {
            void saveDiff(ev);
          }
        }}
      >
        <span>
          {explinationOverride ??
            `Save diff to access it later and share it with others`}
        </span>
        <div className={css.inputs}>
          <TextInput
            ref={inputRef}
            defaultValue={diffTitle}
            onFocus={(ev) => ev.target.select()}
            data-testid="save-diff-modal-title-input"
          />
          <div className={css.expiry}>
            <span>{t('SaveDiffModal.expireIn')}</span>
            <Select
              ref={selectRef}
              data-testid="save-diff-modal-expiry-options"
            >
              <option value="forever">{t('SaveDiffModal.never')}</option>
              <option value="month">1 {t('SaveDiffModal.month')}</option>
              <option value="week">7 {t('SaveDiffModal.days')}</option>
              <option value="day">24 {t('SaveDiffModal.hours')}</option>
            </Select>
          </div>
        </div>
        <div className={css.buttons}>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={() => closeModal()}
          >
            {t('Diff.cancel')}
          </Button>

          <Button
            type="submit"
            style="primary"
            tone="green"
            size="large"
            fullWidth
            isLoading={isLoading}
            data-testid="save-diff-modal-save-button"
          >
            {t('SaveDiffModal.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SaveDiffModal;
