import css from './loading-circle.module.css';
import cx from 'classnames';

const svgValues: Record<
  NonNullable<LoadingCircleProps['size']>,
  { size: number; strokeWidth: number }
> = {
  default: {
    size: 64,
    strokeWidth: 6,
  },
  xs: {
    size: 16,
    strokeWidth: 2,
  },
  small: {
    size: 36,
    strokeWidth: 4,
  },
  large: {
    size: 96,
    strokeWidth: 6,
  },
};

interface LoadingCircleProps {
  progress?: number;
  size?: 'default' | 'xs' | 'small' | 'large';
  style?: 'primary' | 'secondary';
  tone?: 'base'; // only one color for the moment, but we may want more in the future (note that we'd have to handle both primary and secondary too)
}

const LoadingCircle: React.FC<LoadingCircleProps> = ({
  progress,
  size: sizeProp = 'default',
  style = 'primary',
  tone = 'base',
}) => {
  const { size, strokeWidth } = svgValues[sizeProp];

  const showProgress = progress !== undefined && progress >= 0;
  const strokeOffset = showProgress ? progress : 0.75;

  const svgCenter = size / 2;
  const svgRadius = svgCenter - strokeWidth / 2;

  return (
    <div
      key={showProgress ? 'progress' : 'noProgress'} // prevent transitions if toggling between animated and progress
      className={cx(css.loader, css[style], css[tone], {
        [css.smallText]: sizeProp === 'small',
        [css.spin]: !showProgress,
      })}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          transform={`rotate(-90 ${svgCenter} ${svgCenter})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={1}
          stroke="currentColor"
        >
          <circle
            className={css.back}
            cx={svgCenter}
            cy={svgCenter}
            r={svgRadius}
            transform={`scale(1 -1) translate(0 -${size})`}
            strokeDashoffset={strokeOffset}
            pathLength={1}
          />
          <circle
            className={css.front}
            cx={svgCenter}
            cy={svgCenter}
            r={svgRadius}
            strokeDashoffset={1 - strokeOffset}
            pathLength={1}
          />
        </g>
      </svg>
      {showProgress && sizeProp !== 'xs' && (
        <div className={css.progress}>{Math.floor(progress * 100)}%</div>
      )}
    </div>
  );
};

export default LoadingCircle;
