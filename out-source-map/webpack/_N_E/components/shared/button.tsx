import cx from 'classnames';
import EllipsisHorizontalSvg from 'components/shared/icons/ellipsis-horizontal.svg';
import Link, { type LinkProps } from 'next/link';

import css from './button.module.css';
import Icon, { IconProps } from './icon';

interface CleanButtonProps {
  style: 'clean';
  tone?: undefined;
  size?: undefined;
  badge?: undefined;
  iconStartSvg?: undefined;
  iconEndSvg?: undefined;
  fullWidth?: undefined;
  isLoading?: undefined;
  active?: undefined;
}

// basic adds stylings which clean doesn't add (centering and font, to prevent repetition)
interface BasicButtonProps {
  style: 'basic';
  tone?: undefined;
}

export interface StyledButtonProps {
  style: 'primary' | 'secondary' | 'secondary-alt' | 'text';
  tone?:
    | 'base'
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'purple'
    | 'blue'
    | 'light-yellow';
}

interface DefaultButtonProps {
  size?: 'default' | 'small' | 'large' | 'xl';
  badge?: React.ReactNode;
  iconStartSvg?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconEndSvg?: React.FC<React.SVGProps<SVGSVGElement>>;
  fullWidth?: boolean;
  active?: boolean; // sometimes we want to force a button to appear active, eg. for dropdowns
}

export type BaseButtonProps = (
  | CleanButtonProps
  | ((BasicButtonProps | StyledButtonProps) & DefaultButtonProps)
) & {
  className?: string;
};

export type ButtonProps = BaseButtonProps &
  (
    | (LinkProps & { nextLink: true })
    | (JSX.IntrinsicElements['a'] & { href: string })
    | (JSX.IntrinsicElements['span'] & { asSpan: true })
    | (JSX.IntrinsicElements['button'] & { isLoading?: boolean })
  );

const getIconSize = (
  componentSize: DefaultButtonProps['size'],
  hasChildren: boolean,
): NonNullable<IconProps['size']> => {
  if (componentSize === 'small' && hasChildren) {
    return 'xs'; // do not make the icon smaller if there's no text in the button for icon buttons
  }

  if (componentSize === 'xl') {
    if (hasChildren) {
      return 'default';
    } else {
      return 'large';
    }
  }

  return 'small';
};

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  style,
  tone,
  size,
  iconStartSvg,
  iconEndSvg,
  fullWidth,
  className,
  badge,
  active,
  children,
  ...props
}) => {
  const disabled = 'disabled' in props && props.disabled;
  const isLoading = 'isLoading' in props && props.isLoading && !disabled; // disabled state trumps loading state

  const classes = cx(
    className,
    css.button,
    css[style],
    tone && css[tone],
    size ? css[size] : { [css.default]: style !== 'clean' },
    {
      [css.basic]: style !== 'clean',
      [css.fullWidth]: fullWidth,
      [css.loading]: isLoading,
      [css.disabled]: disabled,
      [css.active]: active,
    },
  );

  const iconSize = getIconSize(size, !!children);

  const innerContent = (
    <>
      {!!iconStartSvg && <Icon size={iconSize} svg={iconStartSvg} />}
      {style === 'clean' ? (
        children
      ) : (
        <>
          {children && <span className={css.textContent}>{children}</span>}
          {isLoading && (
            <div className={css.loadingIcon}>
              <Icon size={iconSize} svg={EllipsisHorizontalSvg} />
            </div>
          )}
        </>
      )}
      {!!badge && <div className={css.badge}>{badge}</div>}
      {!!iconEndSvg && <Icon size={iconSize} svg={iconEndSvg} />}
    </>
  );

  if ('nextLink' in props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { nextLink, ...rest } = props;
    return (
      <Link className={classes} {...rest}>
        {innerContent}
      </Link>
    );
  } else if ('href' in props) {
    return (
      <a className={classes} {...props}>
        {innerContent}
      </a>
    );
  } else if ('asSpan' in props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { asSpan, ...rest } = props;
    return (
      <span className={classes} {...rest}>
        {innerContent}
      </span>
    );
  }

  // remove props that aren't meant for the DOM element
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, disabled: _disabled, isLoading: _isLoading, ...rest } = props;
  return (
    <button
      className={classes}
      {...rest}
      type={type || 'button'}
      disabled={isLoading || disabled}
    >
      {innerContent}
    </button>
  );
};

export default Button;
