import React from 'react';
import MessageBanner from 'components/shared/message-banner';
import ipcEvents from '../../ipc-events';

interface ExportErrorMessageBannerProps {
  title?: string;
}

const ExportErrorMessageBanner: React.FC<ExportErrorMessageBannerProps> = ({
  title = 'Error exporting diff',
}) => {
  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const contactUrl = 'https://www.diffchecker.com/contact/';
    window.ipcRenderer.send(ipcEvents.APP__OPEN_EXTERNAL_REQUESTED, contactUrl);
  };

  return (
    <MessageBanner
      type="error"
      title={title}
      message={
        <>
          Please try again. If the problem persists,{' '}
          {process.env.NEXT_PUBLIC_IS_ELECTRON ? (
            <>
              <a href="#" onClick={handleContactClick}>
                please contact support
              </a>
              .
            </>
          ) : (
            <>
              <a href="/contact/" target="_blank" rel="noopener noreferrer">
                please contact support
              </a>
              .
            </>
          )}
        </>
      }
    />
  );
};

export default ExportErrorMessageBanner;
