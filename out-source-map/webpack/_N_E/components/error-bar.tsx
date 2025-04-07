import * as React from 'react';
import Messages from 'lib/messages';
import { useState } from 'react';
import MessageBanner from './shared/message-banner';
import css from './error-bar.module.css';

interface ErrorBarProps {
  code?: string;
  field?: string;
  message?: string;
  details?: string;
}

const ErrorBar: React.FC<ErrorBarProps> = ({
  message,
  code,
  field,
  details,
}) => {
  const [showingDetails, setShowingDetails] = useState(false);
  if (message || code) {
    return (
      <MessageBanner type="error" title="Sign in failed">
        <Messages message={message} code={code} field={field} />
        <div className={css.detailsContainer}>
          {!showingDetails ? (
            <a
              href="#"
              className={css.showDetails}
              onClick={(ev) => {
                ev.preventDefault();
                setShowingDetails(true);
              }}
            >
              Show details
            </a>
          ) : (
            <div className={css.details}>
              {details}
              <div>
                Please email us at admin@diffchecker.com with this error if you
                would like help.
              </div>
              <a
                href="#"
                className={css.showDetails}
                onClick={(ev) => {
                  ev.preventDefault();
                  setShowingDetails(false);
                }}
              >
                Hide details
              </a>
            </div>
          )}
        </div>
      </MessageBanner>
    );
  }
  return null;
};
export default ErrorBar;
