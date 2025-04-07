import css from './diff-change-stat.module.css';
import cx from 'classnames';
import MinusCircleSvg from 'components/shared/icons/minus-circle.svg';
import PlusCircleSvg from 'components/shared/icons/plus-circle.svg';
import MergeCircleSvg from 'components/shared/icons/merge-circle.svg';
import pluralize from 'pluralize';
import Icon from 'components/shared/icon';

const StatIcon: Record<
  DiffChangeStatProps['type'],
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  removal: MinusCircleSvg,
  addition: PlusCircleSvg,
  reorder: MergeCircleSvg,
};

interface DiffChangeStatProps {
  amount: number;
  type: 'removal' | 'addition' | 'reorder';
  className?: string;
}

const DiffChangeStat: React.FC<DiffChangeStatProps> = ({
  amount,
  type,
  className,
}) => {
  return (
    <div className={cx(css.stat, css[type], className)}>
      <Icon svg={StatIcon[type]} size="small" />
      <span>
        {amount} {pluralize(type, amount)}
      </span>
    </div>
  );
};

export default DiffChangeStat;
