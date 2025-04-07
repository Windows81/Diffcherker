import { getItem, setItem } from 'lib/local-storage';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import { useCallback, useEffect, useState } from 'react';
import SaveSvg from 'components/shared/icons/save.svg';
import SavedDiffs from './saved-diffs';
import Sidebar from './sidebar';
import { DiffInputType } from 'types/diff-input-type';
import AdDisplay from 'components/ad-display';
import Tab from 'components/shared/tab';

interface SavedDiffSidebarProps {
  aboveSidebar?: React.ReactNode;
  isHome: boolean;
}

const SavedDiffSidebar: React.FC<SavedDiffSidebarProps> = ({
  aboveSidebar,
  isHome,
}) => {
  const [isShown, setIsShown] = useState(true);
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);

  const handleSideBarLocalStorage = useCallback(() => {
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      const getSideBar = window.store.get('app.showSavedDiffSideBar');
      if (getSideBar) {
        setIsShown(getSideBar);
      }
    } else {
      const getSideBar = getItem('showSavedDiffSideBar');
      if (getSideBar) {
        setIsShown(JSON.parse(getSideBar));
      }
    }
    setCheckedLocalStorage(true);
  }, []);

  const handleMinimizeSideBar = useCallback((newState: boolean) => {
    Tracking.trackEvent('Clicked sidebar minimize button', {
      wasSidebarVisible: !newState,
      sidebar: 'saved-diff',
    });
    setIsShown(newState);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      window.store.set('app.showSavedDiffSideBar', newState);
    } else {
      setItem('showSavedDiffSideBar', JSON.stringify(newState));
    }
  }, []);

  useEffect(() => {
    handleSideBarLocalStorage();
  }, [handleSideBarLocalStorage]);

  return (
    <Sidebar
      header={<Tab svg={SaveSvg} label={t('SidebarSavedDiffs.savedDiffs')} />}
      visible={isShown}
      setVisibility={handleMinimizeSideBar}
      key={
        checkedLocalStorage ? 'checkedLocalStorage' : 'waitingForLocalStorage'
      }
      aboveSidebar={aboveSidebar}
      belowSidebar={
        <AdDisplay diffInputType={DiffInputType.TEXT} position="sidebar" />
      }
      fixedHeight={true}
      isHome={isHome}
    >
      {checkedLocalStorage && <SavedDiffs />}
    </Sidebar>
  );
};

export default SavedDiffSidebar;
