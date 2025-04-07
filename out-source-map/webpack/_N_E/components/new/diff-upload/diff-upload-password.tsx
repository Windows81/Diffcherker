import css from './diff-upload-password.module.css';
import ArrowRightSvg from 'components/shared/icons/arrow-right.svg';
import TextInput from '../../shared/form/text-input';
import IconButton from 'components/shared/icon-button';
import { useCallback, useRef } from 'react';

export interface DiffUploadPasswordProps {
  isIncorrect?: boolean;
  isLoading?: boolean;
  handleSubmitPassword?: (password: string) => void;
  size?: 'default' | 'small';
}

const DiffUploadPassword: React.FC<DiffUploadPasswordProps> = ({
  isIncorrect,
  isLoading,
  handleSubmitPassword,
  size = 'default',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // TODO when not loading but incorrect, put focus here
  const shouldShowIncorrect = isIncorrect && !isLoading;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (inputRef.current) {
        handleSubmitPassword?.(inputRef.current?.value);
      }
    },
    [handleSubmitPassword],
  );

  return (
    <form className={css.input} onSubmit={handleSubmit}>
      <TextInput
        ref={inputRef}
        type="password"
        placeholder="Enter password"
        error={shouldShowIncorrect}
        size={size}
      />
      <IconButton
        size={size === 'default' ? 'large' : 'default'}
        svg={ArrowRightSvg}
        aria-label="Submit password"
        style="secondary-alt"
        tone={shouldShowIncorrect ? 'red' : 'base'}
        type="submit"
        isLoading={isLoading}
      />
    </form>
  );
};

export default DiffUploadPassword;
