import * as React from 'react';
import Modal from 'components/shared/modal';
import css from './name-capture.module.css';
import { User } from 'types/user';
import TextInput from 'components/shared/form/text-input';
import Button from 'components/shared/button';
import { useAppDispatch } from 'redux/store';
import * as UserActions from 'redux/modules/user-module';
import Tracking from 'lib/tracking';
import { useState } from 'react';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';
import cx from 'classnames';

interface CommentModalsNameCaptureProps {
  isOpen: boolean;
  onNameCaptured: () => void;
  closeModal: () => void;
  user: User;
}

const CommentModalsNameCapture: React.FC<CommentModalsNameCaptureProps> = (
  props,
) => {
  const { isOpen, closeModal, onNameCaptured, user } = props;
  const [name, setName] = useState<string>(user.name ?? '');
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  const handleNameCaptureSubmit = async (
    ev: React.FormEvent<HTMLFormElement>,
  ) => {
    ev.preventDefault();

    if (!name) {
      return;
    }

    try {
      setError(undefined);
      setIsLoading(true);
      await dispatch(
        UserActions.changeName({
          name,
        }),
      ).unwrap();
      Tracking.trackEvent('Name captured');
      onNameCaptured();
    } catch (error) {
      setError(normalizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="650px">
      <form className={css.form} onSubmit={handleNameCaptureSubmit}>
        <div className={css.container}>
          <h2 className={css.heading}>{`What’s your name?`}</h2>
          <p>This name will be displayed on the comments you make.</p>
        </div>
        <div>
          <label>
            Email
            <TextInput value={user.email} disabled={true} />
          </label>

          <label>
            Name
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </label>
        </div>
        {error && (
          <div className={css.messageBoxContainer}>
            <MessageBanner title={error.message} type="error" />
          </div>
        )}
        <div className={cx('modal-footer', css.modalButtons)}>
          <Button
            style="secondary"
            tone="base"
            size="large"
            onClick={() => closeModal()}
          >
            Cancel
          </Button>
          <Button
            style="primary"
            tone="green"
            size="large"
            type="submit"
            isLoading={isLoading}
          >
            Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CommentModalsNameCapture;
