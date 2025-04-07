import { Chunk } from 'types/normalize';
import css from './diff-chunk.module.css';
import cx from 'classnames';

interface DiffChunkProps {
  chunk: Chunk;
  innerHtml?: string;
  isModified: boolean;
}

const DiffChunk: React.FC<React.PropsWithChildren<DiffChunkProps>> = ({
  chunk,
  innerHtml,
  isModified,
  children,
}) => {
  const classes = cx(css.chunk, {
    [css.modified]: isModified,
    [css.inserted]: isModified && chunk.type === 'insert',
    [css.removed]: isModified && chunk.type === 'remove',
    [css.equal]: isModified && chunk.type === 'equal',
  });

  const props = innerHtml
    ? { dangerouslySetInnerHTML: { __html: innerHtml } }
    : { children: children || chunk.value };

  return <span className={classes} {...props} />;
};

export default DiffChunk;
