import css from './diff-upload-edit-container.module.css';

const DiffUploadEditContainer: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <div className={css.container}>{children}</div>;
};

export default DiffUploadEditContainer;
