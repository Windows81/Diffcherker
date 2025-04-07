import LoadingCircle from 'components/shared/loaders/loading-circle';
import { Button } from './base';
import css from './GitDiffEntryLoading.module.css';

interface GitDiffEntryLoadingProps {
  /**
   * If provided, is a function that aborts the current load.
   * This is shown to the user as an abort button. When aborted
   * the error view is shown.
   */
  onAbort?: () => void;
}

/**
 * This is the loading component for each git diff file that is shown
 * as the file is being processed.
 * TODO(@izaakschroeder): Consider possibly removing this style of
 * loader entirely and using skeleton states. e.g. the one in MUI:
 * https://mui.com/material-ui/react-skeleton/
 * TODO(@izaakschroeder): Actually wire up the abort button.
 */
export const GitDiffEntryLoading: React.FC<GitDiffEntryLoadingProps> = ({
  onAbort,
}) => {
  return (
    <div className={css.gitDiffEntryLoading}>
      <LoadingCircle size="small" />
      <h2>Loading diff...</h2>

      {onAbort && <Button onClick={onAbort}>Abort</Button>}
    </div>
  );
};
