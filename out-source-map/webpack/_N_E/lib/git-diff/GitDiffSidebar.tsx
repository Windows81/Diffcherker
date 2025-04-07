import Sidebar from 'components/new/sidebar';
import { GitDiffTreeView } from './GitDiffTreeView';
import { FileEntry } from './types';
import { GitDiffFileAtomFamily } from './gitDiffFileAtomFamily';
import Tab from 'components/shared/tab';
import FolderSvg from 'web/components/shared/icons/folder.svg';
import PreferencesSvg from 'web/components/shared/icons/preferences.svg';
import css from './GitDiffSidebar.module.css';
import { useCallback, useState } from 'react';
import { TextDiffOutputSettingsObject } from 'components/new/text-diff-output/settings';
import DiffUnifiedToggle from 'components/new/diff-unified-toggle';
import DiffCollapsedToggle from 'components/new/diff-collapsed-toggle';
import Tracking from 'lib/tracking';
import { DiffInputType } from 'types/diff-input-type';

export type GitDiffSidebarTab = 'files' | 'tools';

interface GitDiffSidebarProps {
  files: FileEntry[];
  fileAtomFamily: GitDiffFileAtomFamily;
  sharedTextSettings: TextDiffOutputSettingsObject;
  setSharedTextSettings: (settings: TextDiffOutputSettingsObject) => void;
}

// note: main reason for making this a separate component is to prevent re-renders on visibility state change
export const GitDiffSidebar: React.FC<GitDiffSidebarProps> = ({
  files,
  fileAtomFamily,
  sharedTextSettings,
  setSharedTextSettings,
}) => {
  const [selectedTab, setSelectedTab] = useState<GitDiffSidebarTab>('files');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

  return (
    <Sidebar
      visible={sidebarOpen}
      setVisibility={handleSidebarToggle}
      header={
        <div className={css.tabs}>
          <Tab
            svg={FolderSvg}
            label="Files"
            selectTab={() => setSelectedTab('files')}
            isSelected={selectedTab === 'files'}
          />
          <Tab
            svg={PreferencesSvg}
            label="Tools"
            selectTab={() => setSelectedTab('tools')}
            isSelected={selectedTab === 'tools'}
          />
        </div>
      }
      width={200}
    >
      {selectedTab === 'files' && (
        <GitDiffTreeView
          loading={false}
          files={files}
          fileAtomFamily={fileAtomFamily}
        />
      )}
      {selectedTab === 'tools' && (
        <div className={css.tools}>
          <div className={css.toggleSection}>
            <DiffUnifiedToggle
              value={sharedTextSettings.diffType}
              onClick={() =>
                Tracking.trackEvent('Clicked git diff toggle', {
                  diffInputType: DiffInputType.TEXT,
                  diffToggle: 'unified',
                })
              }
              handleChange={(diffType) => {
                setSharedTextSettings({
                  ...sharedTextSettings,
                  diffType,
                });
              }}
              checkIfAllowed={() => true}
            />
            <DiffCollapsedToggle
              value={sharedTextSettings.diffCompression}
              onClick={() =>
                Tracking.trackEvent('Clicked git diff toggle', {
                  diffInputType: DiffInputType.TEXT,
                  diffToggle: 'collapsed',
                })
              }
              handleChange={(diffCompression) =>
                setSharedTextSettings({
                  ...sharedTextSettings,
                  diffCompression,
                })
              }
              checkIfAllowed={() => true}
            />
          </div>
          {/* TODO enable when you figure out how to do this with existing jotai workers lmao */}
          {/* <div className={css.section}>
            <div className={css.sectionTitle}>Highlight change</div>
            <div>
              <DiffLevelSwitch
                value={settings.diffLevel}
                handleChange={(diffLevel) =>
                  setSettings({
                    ...settings,
                    diffLevel,
                  })
                }
              />
            </div>
          </div> */}
        </div>
      )}
    </Sidebar>
  );
};
