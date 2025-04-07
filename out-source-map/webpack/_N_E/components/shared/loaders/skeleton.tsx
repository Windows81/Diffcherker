import cx from 'classnames';
import css from './skeleton.module.css';

export interface SkeletonProps {
  type?: 'block' | 'text';
  size?: 'small' | 'medium' | 'large' | 'xl';
  width?: string;
  height?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  type = 'block',
  size,
  width,
  height,
  className,
}) => {
  const isBlock = type === 'block';
  return (
    <div
      className={cx(
        css.skeleton,
        className,
        css[type],
        isBlock && css[size ?? 'medium'],
      )}
      style={{
        width,
        height,
      }}
    ></div>
  );
};

export default Skeleton;
