import { useState, useEffect } from 'react';
import Sidebar from '../../sidebar';
import ipcEvents from 'ipc-events';

interface PdfSidebarProps {
  header: React.ReactNode;
  width?: number;
  instantTransition?: boolean;
  isRedline?: boolean;
}

const PdfSidebar: React.FC<React.PropsWithChildren<PdfSidebarProps>> = ({
  header,
  width,
  instantTransition,
  isRedline,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_ELECTRON && isRedline) {
      window.ipcRenderer.send(
        ipcEvents.APP__REDLINE_SIDEBAR_VISIBILITY_CHANGED,
        isVisible,
      );
    }
  }, [isVisible, isRedline]);

  return (
    <Sidebar
      visible={isVisible}
      setVisibility={setIsVisible}
      header={header}
      width={width}
      instantTransition={instantTransition}
    >
      {children}
    </Sidebar>
  );
};

export default PdfSidebar;
