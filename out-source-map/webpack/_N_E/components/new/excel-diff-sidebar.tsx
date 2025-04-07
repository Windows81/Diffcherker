import React, { MutableRefObject, useCallback, useState } from 'react';
import Sidebar from './sidebar';
import css from './excel-diff-sidebar.module.css';
import Tab from 'components/shared/tab';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import Tracking from 'lib/tracking';
import ExcelDiffOutputSettings from './excel-diff/excel-output/settings';
import { ExcelDiffOutputSettingsObject } from './excel-diff/excel-output/types';
import { ExcelDiffOutputApi } from './excel-diff/excel-output/context';
import { ExcelDiffOutputTypes } from 'lib/output-types';

export type SidebarTab = 'tools';
const tabs: Record<
  SidebarTab,
  {
    svg: React.FC<React.SVGProps<SVGSVGElement>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.FC<any>;
  }
> = {
  tools: {
    svg: PreferencesSvg,
    component: ExcelDiffOutputSettings,
  },
};

const getAvailableTabs = (): SidebarTab[] => {
  return ['tools'];
};

interface ExcelDiffSidebarProps {
  apiRef?: MutableRefObject<ExcelDiffOutputApi | null>;
  setExcelDiffOutputSettings: (settings: ExcelDiffOutputSettingsObject) => void;
  findDifference: () => void;
  clearResult: () => void;
  excelDiffOutputSettings: ExcelDiffOutputSettingsObject;
  currentType: ExcelDiffOutputTypes;
}

const ExcelDiffSidebar: React.FC<ExcelDiffSidebarProps> = ({
  apiRef,
  setExcelDiffOutputSettings,
  findDifference,
  clearResult,
  excelDiffOutputSettings,
  currentType,
}) => {
  const [isShown, setIsShown] = useState(true);
  const [selectedTab] = useState<SidebarTab>('tools');

  const handleMinimizeSideBar = useCallback((newState: boolean) => {
    Tracking.trackEvent('Clicked sidebar minimize button', {
      wasSidebarVisible: !newState,
      sidebar: 'diff-output',
    });
    setIsShown(newState);
  }, []);

  const availableTabs = getAvailableTabs();

  const Component = tabs[selectedTab].component;

  return (
    <Sidebar
      visible={isShown}
      setVisibility={handleMinimizeSideBar}
      header={
        <div className={css.tabs}>
          {availableTabs.map((tab) => (
            <Tab
              key={tab}
              label={tab[0].toUpperCase() + tab.slice(1)}
              svg={tabs[tab].svg}
            />
          ))}
        </div>
      }
    >
      <Component
        apiRef={apiRef}
        setExcelDiffOutputSettings={setExcelDiffOutputSettings}
        findDifference={findDifference}
        clearResult={clearResult}
        excelDiffOutputSettings={excelDiffOutputSettings}
        currentType={currentType}
      />
    </Sidebar>
  );
};

export default ExcelDiffSidebar;
