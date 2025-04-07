import HistorySvg from 'components/shared/icons/history.svg';
import PreferencesSvg from 'components/shared/icons/preferences.svg';
import SaveSvg from 'components/shared/icons/save.svg';
import ChatSvg from 'components/shared/icons/chat.svg';
import { getItem, setItem } from 'lib/local-storage';
import Tracking from 'lib/tracking';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useAppSelector } from 'redux/store';

import DiffHistory from './diff-history';
import SavedDiffs from './saved-diffs';
import Sidebar from './sidebar';
import css from './text-diff-sidebar.module.css';
import { getDiffs } from 'redux/selectors/diff-selector';
import usePrevious from 'lib/hooks/use-previous';
import Tab from 'components/shared/tab';
import TextDiffOutputSettings, {
  TextDiffOutputSettingsObject,
} from './text-diff-output/settings';
import { TextDiffOutputApi } from './text-diff-output/context';

export type SidebarTab = 'settings' | 'saved' | 'history' | 'comments';
const tabs: Record<
  SidebarTab,
  {
    svg: React.FC<React.SVGProps<SVGSVGElement>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.FC<any>;
    shouldShow: ({
      isLiveDiff,
      isHome,
      isLoggedIn,
    }: {
      isLiveDiff?: boolean;
      isHome?: boolean;
      isLoggedIn?: boolean;
    }) => boolean;
  }
> = {
  settings: {
    svg: PreferencesSvg,
    component: TextDiffOutputSettings,
    shouldShow: ({ isHome }) => !isHome,
  },
  saved: {
    svg: SaveSvg,
    component: SavedDiffs,
    shouldShow: ({ isLiveDiff }) =>
      !process.env.NEXT_PUBLIC_IS_ELECTRON && !!isLiveDiff,
  },
  history: {
    svg: HistorySvg,
    component: DiffHistory,
    shouldShow: () => true,
  },
  comments: {
    svg: ChatSvg,
    component: TextDiffOutputSettings,
    shouldShow: () => true,
  },
};

const getDefaultTab = (isHome: boolean): SidebarTab => {
  return process.env.NEXT_PUBLIC_IS_ELECTRON && isHome ? 'history' : 'settings';
};

const getAvailableTabs = (
  isLiveDiff: boolean,
  isHome: boolean,
): SidebarTab[] => {
  if (isHome) {
    return ['history'];
  } else if (process.env.NEXT_PUBLIC_IS_ELECTRON || !isLiveDiff) {
    // electron or regular web diff
    return ['settings', 'history'];
  } else {
    // real-time diff on web
    return ['settings', 'saved', 'history'];
  }
};

interface TextDiffSidebarProps {
  isHome: boolean;
  aboveSidebar?: React.ReactNode;
  settings?: TextDiffOutputSettingsObject;
  apiRef?: MutableRefObject<TextDiffOutputApi | null>;
  onSettingsChange?: (newSettings: TextDiffOutputSettingsObject) => void;
}

const TextDiffSidebar: React.FC<TextDiffSidebarProps> = ({
  isHome,
  aboveSidebar,
  settings,
  apiRef,
  onSettingsChange,
}) => {
  const [selectedTab, setSelectedTab] = useState<SidebarTab>(
    getDefaultTab(isHome),
  );
  const [isShown, setIsShown] = useState(true);
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);
  const isLiveDiff = useAppSelector(
    (state) => state.app.diffVersion === 'live',
  );
  const recentDiffs = useAppSelector(getDiffs);
  const prevIsHome = usePrevious(isHome);

  const handleSideBarLocalStorage = useCallback(() => {
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      const getSideBar = window.store.get('app.showOutputSidebar');
      if (getSideBar) {
        setIsShown(getSideBar);
      }
    } else {
      const getSideBar = getItem('showOutputSidebar');
      if (getSideBar) {
        setIsShown(JSON.parse(getSideBar));
      }
    }
    setCheckedLocalStorage(true);
  }, []);

  const handleMinimizeSideBar = useCallback((newState: boolean) => {
    Tracking.trackEvent('Clicked sidebar minimize button', {
      wasSidebarVisible: !newState,
      sidebar: 'diff-output',
    });
    setIsShown(newState);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      window.store.set('app.showOutputSidebar', newState);
    } else {
      setItem('showOutputSidebar', JSON.stringify(newState));
    }
  }, []);

  const availableTabs: SidebarTab[] = getAvailableTabs(isLiveDiff, isHome);

  const actualSelectedTab: SidebarTab =
    prevIsHome !== isHome || !availableTabs.includes(selectedTab)
      ? getDefaultTab(isHome)
      : selectedTab;

  const chooseTab = (tab: SidebarTab) => {
    setSelectedTab(tab);
    Tracking.trackEvent('Clicked output sidebar tab', { tab });
  };

  useEffect(() => {
    handleSideBarLocalStorage();
  }, [handleSideBarLocalStorage]);

  useEffect(() => {
    if (actualSelectedTab !== selectedTab) {
      setSelectedTab(actualSelectedTab);
    }
  }, [actualSelectedTab, selectedTab]);

  const Component = tabs[actualSelectedTab].component;

  return process.env.NEXT_PUBLIC_IS_ELECTRON &&
    recentDiffs.length === 0 &&
    isHome ? (
    <></>
  ) : (
    <Sidebar
      aboveSidebar={aboveSidebar}
      visible={isShown}
      setVisibility={handleMinimizeSideBar}
      key={
        checkedLocalStorage ? 'checkedLocalStorage' : 'waitingForLocalStorage'
      }
      header={
        <div className={css.tabs} key={isHome ? 'isHome' : 'isNotHome'}>
          {availableTabs.map((tab) => (
            <Tab
              key={tab}
              label={tab[0].toUpperCase() + tab.slice(1)}
              showLabel={false}
              svg={tabs[tab].svg}
              selectTab={() => chooseTab(tab)}
              isSelected={tab === actualSelectedTab}
            />
          ))}
        </div>
      }
    >
      <Component
        allowMerge={true}
        allowRealtimeDiff={true}
        allowSyntaxHighlighting={true}
        allowSkipToEditor={true}
        settings={settings}
        onSettingsChange={onSettingsChange}
        apiRef={apiRef}
      />
    </Sidebar>
  );
};

export default TextDiffSidebar;
