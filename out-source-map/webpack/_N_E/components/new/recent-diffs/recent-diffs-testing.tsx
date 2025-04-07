// TODO: remove this whole thing

import { useState, useEffect } from 'react';
import * as electron from '../../../lib/state/electron';

import css from './recent-diffs-testing.module.css';
import cx from 'classnames';

import { DiffInputType } from 'types/diff-input-type';
import { v4 as uuidv4 } from 'uuid';

import {
  RecentDiff,
  RecentFile,
  addRecentDiff,
  addRecentFile,
  addRecentTextDiff,
  getRecentDiffs,
  getRecentFiles,
} from './commands/recent-diff-utils';
import ipcEvents from 'ipc-events';

const emptyRecentDiffs = () => {
  electron.storeSet('recent.diffs', []);
};

const emptyRecentFiles = () => {
  electron.storeSet('recent.files', []);
};

const testedExtensions = ['docx', 'doc'];

const RecentDiffsTesting = () => {
  const [recentDiffs, setRecentDiffs] = useState<RecentDiff[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const diffs = getRecentDiffs();
    setRecentDiffs(diffs as RecentDiff[]);
    const files = getRecentFiles();
    setRecentFiles(files as RecentFile[]);

    electron.storeSubscribe('recent.diffs', (diffs) => {
      setRecentDiffs(diffs as RecentDiff[]);
    });

    electron.storeSubscribe('recent.files', (files) => {
      setRecentFiles(files as RecentFile[]);
    });
  }, []);

  const addExampleDiff = (diffType: DiffInputType, extension?: string) => {
    let fileExtension = '';
    switch (diffType) {
      case DiffInputType.PDF:
        fileExtension = extension ? `.${extension}` : '.pdf';
        break;
      case DiffInputType.IMAGE:
        fileExtension = '.jpg';
        break;
      case DiffInputType.EXCEL:
        fileExtension = '.xlsx';
        break;
      case DiffInputType.TEXT:
        fileExtension = '.txt';
        break;
    }

    if (diffType === DiffInputType.TEXT) {
      addRecentTextDiff({
        left: {
          data: `[TESTING] ${uuidv4()}`,
        },
        right: {
          data: `[TESTING] ${uuidv4()}`,
        },
      });
      addRecentFile({
        filePath: `[TESTING] ${uuidv4()}` + '.txt',
        diffType: DiffInputType.TEXT,
      });
      addRecentFile({
        filePath: `[TESTING] ${uuidv4()}` + '.txt',
        diffType: DiffInputType.TEXT,
      });
    } else {
      addRecentDiff({
        left: {
          filePath: `[TESTING] ${uuidv4()}` + fileExtension,
        },
        right: {
          filePath: `[TESTING] ${uuidv4()}` + fileExtension,
        },
        diffType: diffType,
      } as RecentDiff);
    }
  };

  const clearAll = async () => {
    await emptyTextFromDocStorage();
    emptyRecentDiffs();
    emptyRecentFiles();
  };

  useEffect(() => {
    console.log('recentDiffs', recentDiffs);
  }, [recentDiffs]);

  useEffect(() => {
    console.log('recentFiles', recentFiles);
  }, [recentFiles]);

  const emptyTextFromDocStorage = async () => {
    const toBePurgedPaths = new Set<string>();
    recentDiffs.forEach((diff) => {
      if (diff.diffType === DiffInputType.TEXT) {
        toBePurgedPaths.add(diff.left.filePath);
        toBePurgedPaths.add(diff.right.filePath);
      }
    });
    await window.ipcRenderer.invoke(ipcEvents.APP__DELETE_FILES, {
      paths: Array.from(toBePurgedPaths),
    });
  };

  return (
    <div className={cx(css.view)}>
      <h1 className={cx(css.title)}>
        WELCOME 2 THE RECENT FILES TESTING!!!!!!!
      </h1>
      <div className={cx(css.container)}>
        <div className={cx(css.interfaceContainer)}>
          <button onClick={clearAll}>CLEAR ALL</button>
          <div className={cx(css.buttonGroup)}>
            <button onClick={() => addExampleDiff(DiffInputType.PDF)}>
              ADD PDF DIFF
            </button>
            <button onClick={() => addExampleDiff(DiffInputType.PDF, 'docx')}>
              ADD DOCX DIFF
            </button>
          </div>
          <button onClick={() => addExampleDiff(DiffInputType.IMAGE)}>
            ADD IMAGE DIFF
          </button>
          <button onClick={() => addExampleDiff(DiffInputType.EXCEL)}>
            ADD SPREADSHEET DIFF
          </button>
          <button onClick={() => addExampleDiff(DiffInputType.TEXT)}>
            ADD TEXT DIFF
          </button>
          <button onClick={() => addExampleDiff(DiffInputType.FOLDER)}>
            ADD FOLDER DIFF
          </button>
        </div>

        <div className={cx(css.titles)}>
          <h1>THERE ARE {recentDiffs.length} RECENT DIFFS</h1>
          <h1>THERE ARE {recentFiles.length} RECENT FILES</h1>
        </div>

        <div className={cx(css.items)}>
          <ul className={cx(css.itemsList)}>
            {recentDiffs.map((diff, index) => {
              return (
                <li key={index} className={cx(css.diff, css[diff.diffType])}>
                  <h1 className={cx(css.diffType)}>{diff.diffType}</h1>
                  <div className={cx(css.diffInfo)}>
                    <h1>LEFTFILENAME: {diff.left.fileName}</h1>
                    <h2>LEFTFILEPATH: {diff.left.filePath}</h2>
                    <h1>RIGHTFILENAME: {diff.right.fileName}</h1>
                    <h2>RIGHTFILEPATH: {diff.right.filePath}</h2>
                    <h2>LAST OPENED: {diff.lastOpened}</h2>
                  </div>
                </li>
              );
            })}
          </ul>

          <ul className={cx(css.itemsList)}>
            {recentFiles.map((file, index) => {
              const [name, extension] = file.filePath.split(/\.(?=[^.]+$)/); // splits from rightmost dot
              return (
                <li
                  key={index}
                  className={cx(
                    css.file,
                    css[
                      testedExtensions.includes(extension ?? '')
                        ? extension
                        : file.diffType
                    ],
                  )}
                >
                  <div className={cx(css.diffInfo)}>
                    <h1>FILENAME: {name}</h1>
                    <h2>FILEPATH: {file.filePath}</h2>
                    <h2>LAST OPENED: {file.lastOpened}</h2>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecentDiffsTesting;
