import css from './diff-stats.module.css';
import DiffChangeStat from './diff-change-stat';

interface DiffStatsProps {
  added?: number;
  removed?: number;
  reordered?: number;
}

const exists = (val: number | undefined): val is number => {
  return !!(val || val === 0); // still show 0
};

const DiffStats: React.FC<DiffStatsProps> = (props: DiffStatsProps) => {
  const { added, removed, reordered } = props;
  return (
    <div className={css.diffStats}>
      {exists(removed) && <DiffChangeStat amount={removed} type="removal" />}
      {exists(added) && <DiffChangeStat amount={added} type="addition" />}
      {exists(reordered) && (
        <DiffChangeStat amount={reordered} type="reorder" />
      )}
    </div>
  );
};

export default DiffStats;
