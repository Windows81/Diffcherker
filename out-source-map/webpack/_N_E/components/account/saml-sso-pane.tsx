import Button from 'components/shared/button';
import SettingsSvg from 'components/shared/icons/settings.svg';
import css from './saml-sso-pane.module.css';
import { Organization } from 'types/organization';
import { useAppSelector } from 'redux/store';
import OkCircleSvg from 'components/shared/icons/ok-circle.svg';
import Icon from 'components/shared/icon';

interface AccountSamlSsoPaneProps {
  organization: Organization;
}

export const AccountSamlSsoPane: React.FC<AccountSamlSsoPaneProps> = () => {
  const samlSsoConfigured = useAppSelector(
    (state) => state.organization.samlSsoConfigured,
  );

  return (
    <div className={css.accountSamlSsoPane}>
      <h2 className={css.accountSamlSsoPaneHeader}>SAML Single Sign-On</h2>
      <p className={css.accountSamlSsoInfo}>
        {samlSsoConfigured ? (
          <span className={css.configured}>
            <Icon svg={OkCircleSvg} /> Single Sign-On is enabled.
          </span>
        ) : (
          'Single Sign-On is not yet configured for your organization.'
        )}
      </p>
      <div>
        <Button
          href="/account/organization"
          iconStartSvg={SettingsSvg}
          style="secondary"
          tone="base"
        >
          {samlSsoConfigured ? 'Modify SAML SSO' : 'Configure SAML SSO'}
        </Button>
      </div>
    </div>
  );
};
