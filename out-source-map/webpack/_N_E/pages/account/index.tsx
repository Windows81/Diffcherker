import { useAppDispatch, useAppSelector } from 'redux/store';
import { useCallback, useEffect, useState } from 'react';
import * as UserActions from 'redux/modules/user-module';
import * as LicenseActions from 'redux/modules/license-module';
import * as PaymentsActions from 'redux/modules/payments-module';
import * as OrganizationActions from 'redux/modules/organization-module';
import Page from 'components/new/page';
import { AccountUserPane } from 'components/account/user-pane';
import { AccountSubscriptionPane } from 'components/account/subscription-pane';
import { AccountDesktopAppPane } from 'components/account/desktop-app-pane';
import { AccountDangerZonePane } from 'components/account/danger-zone-pane';
import css from './index.module.css';
import withSession from 'components/with-session';

import AccountModalsChangeEmail from 'components/account/modals/change-email';
import AccountModalsSetTaxId from 'components/account/modals/set-tax-id';
import AccountModalsDeleteAccount from 'components/account/modals/delete-account';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { AccountSamlSsoPane } from 'components/account/saml-sso-pane';
import Skeleton from 'components/shared/loaders/skeleton';
import Skeletons from 'components/shared/loaders/skeletons';
import titleTemplate from 'lib/title-template';
import Breadcrumbs from 'components/shared/navigation/breadcrumbs';
import Breadcrumb from 'components/shared/navigation/breadcrumb';

export const Account: React.FC = () => {
  const [isChangeEmailModalVisible, setIsChangeEmailModalVisible] =
    useState<boolean>(false);
  const [isSetTaxIdModalVisible, setIsSetTaxIdModalVisible] =
    useState<boolean>(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] =
    useState<boolean>(false);
  const [isSubscriptionsLoading, setIsSubscriptionLoading] =
    useState<boolean>(true);

  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector(
    (state) => state.organization.organization,
  );
  const isEnterprise = user?.planTier === 'enterprise';

  const dispatch = useAppDispatch();
  const router = useRouter();

  const signout = useCallback(async () => {
    Tracking.handleLogout();
    await dispatch(UserActions.logout());
    router.push('/');
  }, [dispatch, router]);

  const deleteUser = useCallback(async () => {
    if (user) {
      await dispatch(UserActions.deleteUser({ idOrEmail: user.id })).unwrap();
    }

    signout();
  }, [dispatch, signout, user]);

  useEffect(() => {
    const loadAccountDetails = async () => {
      setIsSubscriptionLoading(true);

      await Promise.all([
        dispatch(LicenseActions.getMyLicense()),
        dispatch(PaymentsActions.getMySubscriptions()),
        dispatch(OrganizationActions.getMine()),
        dispatch(PaymentsActions.getMyPaymentMethods()),
      ]);

      setIsSubscriptionLoading(false);
    };

    loadAccountDetails();
  }, [user?.id, dispatch]);

  return (
    <Page name="Account" title={titleTemplate('Account')}>
      <div className={css.container}>
        <Breadcrumbs>
          <Breadcrumb href="/">Home</Breadcrumb>
          <Breadcrumb href="/account">Account Settings</Breadcrumb>
        </Breadcrumbs>
        {user && (
          <AccountUserPane
            user={user}
            onChangeEmail={() => setIsChangeEmailModalVisible(true)}
            onSetTaxId={() => setIsSetTaxIdModalVisible(true)}
            onSignOut={() => signout()}
          />
        )}
        {isSubscriptionsLoading ? (
          <Skeletons spacing="xl">
            <Skeleton size="xl" />
            <Skeleton size="xl" />
            <Skeleton size="xl" />
          </Skeletons>
        ) : (
          <>
            <AccountSubscriptionPane />
            {organization && isEnterprise && (
              <AccountSamlSsoPane organization={organization} />
            )}
            <AccountDesktopAppPane />
            <AccountDangerZonePane
              onDeleteAccount={() => setIsDeleteAccountModalVisible(true)}
            />
          </>
        )}
      </div>
      <AccountModalsChangeEmail
        closeModal={() => setIsChangeEmailModalVisible(false)}
        isOpen={isChangeEmailModalVisible}
      />
      <AccountModalsSetTaxId
        closeModal={() => setIsSetTaxIdModalVisible(false)}
        isOpen={isSetTaxIdModalVisible}
      />
      <AccountModalsDeleteAccount
        isOpen={isDeleteAccountModalVisible}
        onConfirmDelete={deleteUser}
        closeModal={() => setIsDeleteAccountModalVisible(false)}
      />
    </Page>
  );
};

export default withSession(Account);
