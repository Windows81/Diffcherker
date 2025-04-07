import css from './LoadingSpinner.module.css';

/**
 * A simple loading spinner component that somewhat mimics the default
 * macOS style spinner.
 *
 * TODO(@izaakschroeder): Design should codify what loading spinners
 * should look like.
 */
export const LoadingSpinner = () => {
  return (
    <div className={css.spinner}>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
      <div className={css.spinnerBlade}></div>
    </div>
  );
};
