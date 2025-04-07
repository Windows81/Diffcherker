import Tracking from 'lib/tracking';
import { createContext, useCallback, useContext, useState } from 'react';
import DesktopModal from './desktop-modal';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';

interface DesktopModalContextType {
  openDesktopModal: (position: string) => void;
}

const DesktopModalContext = createContext<DesktopModalContextType>({
  openDesktopModal: () => undefined,
});

export const useDesktopModal = () => {
  return useContext(DesktopModalContext);
};

export const DesktopModalInjector: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const isPro = useAppSelector(isProUser);
  const [isOpen, setIsOpen] = useState(false);

  const openDesktopModal = useCallback(
    (position: string) => {
      if (!isPro) {
        setIsOpen(true);
        Tracking.trackEvent('Saw desktop modal', {
          position,
        });
      }
    },
    [isPro],
  );

  return (
    <DesktopModalContext.Provider value={{ openDesktopModal }}>
      {children}
      {!isPro && (
        <DesktopModal isOpen={isOpen} closeModal={() => setIsOpen(false)} />
      )}
    </DesktopModalContext.Provider>
  );
};
