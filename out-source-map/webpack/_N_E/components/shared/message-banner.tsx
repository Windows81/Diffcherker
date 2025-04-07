import cx from 'classnames';
import ErrorCircleSvg from 'components/shared/icons/opaque/error-circle.svg';
import InfoCircleSvg from 'components/shared/icons/opaque/info-circle.svg';
import OkCircleSvg from 'components/shared/icons/opaque/ok-circle.svg';
import CancelCircleSvg from 'components/shared/icons/opaque/cancel-circle.svg';
import Icon from './icon';
import css from './message-banner.module.css';
import MessageError from 'types/message-error';

type MessageBannerType = 'info' | 'success' | 'warning' | 'error' | 'userError';

const messageBannerSvg: Record<
  MessageBannerType,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  info: InfoCircleSvg,
  success: OkCircleSvg,
  warning: ErrorCircleSvg,

  /* 
    Mikołaj's general rule: if something goes wrong with the user (eg. uploading wrong format), show 'x' icon, 
    and if something goes wrong app-side, show '!' icon
  */
  error: ErrorCircleSvg,
  userError: CancelCircleSvg,
};

interface BaseMessageBannerProps {
  className?: string;
  noIndent?: boolean; // this is the same style as mobile, but sometimes we want this (eg. error banner on dropzones since it takes only half the screen)
  centered?: boolean;
  size?: 'default' | 'xs' | 'small' | 'xl';
  children?: React.ReactNode;
}

interface ErrorMessageBannerProps extends BaseMessageBannerProps {
  error: MessageError;
}

interface OtherMessageBannerProps extends BaseMessageBannerProps {
  type: MessageBannerType;
  title: string;
  message?: string | React.ReactNode;
}

type MessageBannerProps = ErrorMessageBannerProps | OtherMessageBannerProps;

const MessageBanner: React.FC<MessageBannerProps> = (props) => {
  const size = props.size ?? 'default';
  let type: MessageBannerType;
  let title: string;
  let message: string | React.ReactNode | undefined;
  let children: React.ReactNode | undefined;
  if ('error' in props) {
    type = props.error.type === 'user' ? 'userError' : 'error';
    title = props.error.title;
    message = props.error.message;
  } else {
    type = props.type;
    title = props.title;
    props.message && (message = props.message);
    props.children && (children = props.children);
  }

  return (
    <div
      className={cx(css.banner, css[type], css[size], props.className, {
        [css.centered]: props.centered,
      })}
    >
      <div className={css.top}>
        <Icon
          svg={messageBannerSvg[type]}
          size={size === 'xs' ? 'small' : 'default'}
        />
        <div className={css.title}>{title}</div>
      </div>
      {children && <div className={css.message}>{children}</div>}
      {message && (
        <div
          className={cx(css.message, {
            [css.noIndent]: props.noIndent || props.centered,
          })}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default MessageBanner;
