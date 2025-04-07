import cx from 'classnames';
import css from './button.module.css';
import Icon from 'components/shared/icon';
import CommentCircle from 'components/shared/icons/comment-circle.svg';

interface CommentButtonProps {
  highlight?: boolean;
  toggled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
}

const CommentButton: React.FC<CommentButtonProps> = ({
  highlight = false,
  toggled = false,
  className,
  children,
  onClick = () => {
    /* noop */
  },
}) => {
  return (
    <button
      className={cx(
        css.button,
        highlight && css.highlight,
        toggled && css.toggled,
        className,
      )}
      onClick={onClick}
    >
      <Icon svg={CommentCircle} /> {children}
    </button>
  );
};

export default CommentButton;
