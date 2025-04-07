import * as AppActions from 'redux/modules/app-module';
import Page from 'components/new/page';
import ErrorPage from 'next/error';
import Link from 'next/link';
import React, { useLayoutEffect } from 'react';
import { useAppDispatch } from 'redux/store';
import ElectronTitle from 'types/electron-page-titles';
import ChevronRightSVG from 'web/components/shared/icons/chevron-right.svg';
import RecentDiffsView from 'components/new/recent-diffs/recent-diffs-view';

import TextCompareSVG from '../static/images/new/text-compare.svg';
import DocumentCompareSVG from '../static/images/new/document-compare.svg';
import ImageCompareSVG from '../static/images/new/image-compare.svg';
import ExcelCompareSVG from '../static/images/new/excel-compare.svg';
import FolderCompareSVG from '../static/images/new/folder-compare.svg';

import css from './start-desktop-tab.module.css';
import dynamic from 'next/dynamic';

const AuthenticationWrapper = dynamic(
  async () => {
    return await import('components/new/authentication');
  },
  { ssr: false },
);

const StartDesktopTab: React.FC = () => {
  const dispatch = useAppDispatch();
  useLayoutEffect(() => {
    // we need to use layout effect to remove white flash on dark mode
    if (typeof window !== 'undefined') {
      dispatch(AppActions.actions.initializeAppStore());
    }
  });

  const links = [
    {
      key: 'text',
      url: '/text-compare',
      alt: 'text diff icon',
      image: TextCompareSVG,
      imageBg: 'var(--theme-colors-background-base-tint-default)',
      label: 'Text',
      desc: 'Plain text files',
    },
    {
      key: 'document',
      url: '/word-pdf-compare',
      alt: 'pdf diff icon',
      image: DocumentCompareSVG,
      imageBg:
        'linear-gradient(to right, var(--theme-colors-background-blue-tint-default), var(--theme-colors-background-red-tint-default))',
      label: 'Documents',
      desc: 'PDF, Word, etc.',
    },
    {
      key: 'images',
      url: '/image-compare',
      alt: 'text diff icon',
      image: ImageCompareSVG,
      imageBg: 'var(--theme-colors-background-purple-tint-default)',
      label: 'Images',
      desc: 'Photos, Graphics, etc.',
    },
    {
      key: 'excel',
      url: '/excel-compare',
      alt: 'excel diff icon',
      image: ExcelCompareSVG,
      imageBg: 'var(--theme-colors-background-green-tint-default)',
      label: 'Spreadsheets',
      desc: 'Excel, CSV, etc.',
    },
    {
      key: 'folders',
      url: '/folder-compare',
      alt: 'folders diff icon',
      image: FolderCompareSVG,
      imageBg: 'var(--theme-colors-background-yellow-tint-default)',
      label: 'Folders',
      desc: 'Entire directories',
    },
  ];

  return (
    <Page name="Start Desktop Tab" title={ElectronTitle.NewDiff}>
      <AuthenticationWrapper>
        <div className={css.view}>
          <div className={css.container}>
            <div className={css.diffSelectContainer}>
              <h1 className={css.title}>New comparison</h1>
              <div className={css.selectionGrid}>
                {links.map((link) => (
                  <Link href={link.url} key={link.url} className={css.card}>
                    <div
                      className={css.image}
                      style={{ background: link.imageBg }}
                    >
                      <link.image className={css.svg} />
                    </div>
                    <div className={css.content}>
                      <div className={css.info}>
                        <h1 className={css.label}>{link.label}</h1>
                        <h2 className={css.desc}>{link.desc}</h2>
                      </div>
                      <ChevronRightSVG className={css.chevron} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <RecentDiffsView />
          </div>
        </div>
      </AuthenticationWrapper>
    </Page>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : StartDesktopTab;
