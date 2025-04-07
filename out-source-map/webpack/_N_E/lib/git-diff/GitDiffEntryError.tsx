import { Button } from './base';
import css from './GitDiffEntryError.module.css';

interface GitDiffEntryErrorProps {
  /**
   * If provided, is a function that attempts to clear the current
   * error and file state and reload the file. This is mostly a last
   * ditch effort to recover.
   */
  onReload?: () => void;

  /**
   * True if an error has happened.
   */
  error?: boolean;

  /**
   * Details about the errors that are currently being experienced.
   */
  errors?: Error[];
}

/**
 * This is basically the error boundary component for a git diff file.
 * Whenever an error occurs on an individual file this is the component
 * that is used.
 */
export const GitDiffEntryError: React.FC<GitDiffEntryErrorProps> = ({
  error,
  errors,
  onReload,
}) => {
  if (!error) {
    return null;
  }
  return (
    <div className={css.gitDiffEntryError}>
      <h2>An error occurred</h2>
      {errors?.map((err, index) => {
        return <div key={index}>{err.message}</div>;
      })}
      {onReload && <Button onClick={onReload}>Reload</Button>}
    </div>
  );
};
