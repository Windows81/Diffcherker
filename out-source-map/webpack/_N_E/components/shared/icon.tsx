import css from './icon.module.css';
import cx from 'classnames';

export interface IconProps {
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  size?: 'xs' | 'small' | 'default' | 'large' | 'xl';
  className?: string;
  label?: string;
}

const Icon: React.FC<IconProps> = ({
  svg,
  size = 'default',
  className,
  label,
}) => {
  const Svg = svg;
  return (
    <Svg
      className={cx(css[size], className)}
      viewBox="0 0 16 16" // viewBox needs to be added back in since importing inline SVGs removes it
      width="16"
      height="16"
      preserveAspectRatio="none"
      aria-label={label}
    />
  );
};

export default Icon;
