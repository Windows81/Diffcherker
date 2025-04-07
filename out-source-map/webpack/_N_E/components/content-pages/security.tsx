import * as React from 'react';
import SecurityOfflineIcon from 'static/images/new/security-offline.svg';
import SecurityPrivateIcon from 'static/images/new/security-private.svg';
import SecuritySecureIcon from 'static/images/new/security-secure.svg';
import SecurityLegalDocumentsIcon from 'static/images/new/security-legal-documents.svg';
import SecurityPasswordProtectedIcon from 'static/images/new/security-password-protected.svg';
import SecurityTaxesIcon from 'static/images/new/security-taxes.svg';
import SecurityNetworksIcon from 'static/images/new/security-networks.svg';
import SecuritySensitiveInformationIcon from 'static/images/new/security-sensitive-information.svg';
import SecurityCondidentialCodeIcon from 'static/images/new/security-confidential-code.svg';
import page from 'pages/desktop.module.css';
import css from './security.module.css';

const Security = (): JSX.Element => {
  return (
    <div className={css.security}>
      <ul className={css.offlineIcons}>
        <li className={css.offlineIconsItem}>
          <SecurityOfflineIcon />
          <span className={page.label}>Offline</span>
        </li>
        <li className={css.offlineIconsItem}>
          <SecurityPrivateIcon />
          <span className={page.label}>Private</span>
        </li>
        <li className={css.offlineIconsItem}>
          <SecuritySecureIcon />
          <span className={page.label}>Secure</span>
        </li>
      </ul>
      <div className={css.offlineDetails}>
        <div className={css.offlineDetailsColumn}>
          <h3 className={page.headingXs}>How does it work?</h3>
          <div className={css.offlineDetailsDescriptionBlock}>
            <p className={page.paragraph}>
              Diffchecker Desktop operates exclusively on your computer, without
              any interaction with our web servers. This guarantees
              industry-leading functionality and faster speed, all packaged in a
              powerful interface designed for utmost security.
            </p>
            <br />
            <p className={page.paragraph}>
              Whether you find yourself at JFK or Mount Everest, browse your
              files with confidence knowing that Diffchecker Desktop operates
              fully offline, keeping your client data safe on your machine.
            </p>
          </div>
        </div>
        <div className={css.offlineDetailsColumn}>
          <h3 className={page.headingXs}>Perfect for</h3>
          <ul className={css.offlineDetailsUsecases}>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecurityLegalDocumentsIcon />
              <span className={page.caption}>Legal documents</span>
            </li>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecurityTaxesIcon />
              <span className={page.caption}>Tax forms</span>
            </li>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecurityCondidentialCodeIcon />
              <span className={page.caption}>Sensitive code</span>
            </li>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecurityPasswordProtectedIcon />
              <span className={page.caption}>Encrypted files</span>
            </li>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecuritySensitiveInformationIcon />
              <span className={page.caption}>Confidential data</span>
            </li>
            <li className={css.offlineDetailsUsecasesBlock}>
              <SecurityNetworksIcon />
              <span className={page.caption}>Unsecured networks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Security;
