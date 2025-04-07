import Icon, { IconProps } from '../icon';
import css from './loading-overlay.module.css';
import EllipsisHorizontalSvg from 'components/shared/icons/ellipsis-horizontal.svg';

export interface LoadingOverlayProps {
  size?: IconProps['size'];
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ size }) => {
  return (
    <div className={css.overlay}>
      <div className={css.loadingIcon}>
        <Icon size={size} svg={EllipsisHorizontalSvg} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
