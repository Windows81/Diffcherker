import * as React from 'react';
import FolderDiffChecker from 'components/folder-diff-checker';
import Page from 'components/new/page';
import ErrorPage from 'next/error';
import ElectronTitle from 'types/electron-page-titles';
import css from './folder-compare.module.css';
import { useUrlParams } from 'lib/state/urlParams';

const FolderDiff: React.FC = () => {
  const { leftPath: initialLeftPath, rightPath: initialRightPath } =
    useUrlParams();

  const pageProps = {
    title: ElectronTitle.FolderDiff,
  };

  return (
    <Page name="Folder diff" fullWidth {...pageProps}>
      <div className={css.folderDiffContainer}>
        <FolderDiffChecker
          initialLeftPath={initialLeftPath}
          initialRightPath={initialRightPath}
        />
      </div>
    </Page>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : FolderDiff;
