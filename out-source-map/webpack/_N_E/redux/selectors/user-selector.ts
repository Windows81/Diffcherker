import { createSelector } from '@reduxjs/toolkit';
import { type UserState } from 'redux/modules/user-module';
import { State } from 'redux/store';
import { PlanTier } from 'types/subscription';

export const isLoggedIn = ({ user }: State): boolean => !!user.user;

export const getSessionStatus = ({ user }: State): UserState['status'] =>
  user.status;

export const hasLicense = ({ license }: State): boolean => !!license?.key;

export const hasOtherLicenses = ({ user: { user } }: State) => {
  return !!user?.licenses?.find(
    (license) => !!license?.key && !license.isExpired,
  );
};

export const getUserRole = ({ user }: State): string | undefined =>
  user?.user?.role;

export const getDiffType = ({ user }: State): string | undefined =>
  user.diffType;

export const getUserPlanTier = ({ user: { user }, license }: State): PlanTier =>
  (process.env.NEXT_PUBLIC_IS_ELECTRON ? license : user)?.planTier ?? 'free';

/** User that has no license, organization, subscription in any form */
export const isFreeUser = (store: State): boolean => {
  return !isProUser(store) && !isOrganizationAdmin(store);
};

export const isFreeUserWithLicenses = (store: State): boolean => {
  return !isProUser(store) && hasOtherLicenses(store);
};

/** User that has a license, include those who are on a trial as well */
export const isProUser = ({ license }: State): boolean =>
  !!process.env.NEXT_PUBLIC_IS_ELECTRON ||
  (!!license?.key && !license?.isExpired && !license?.isRevoked);

/** User that has a trial license */
export const isTrialUser = (store: State): boolean => {
  return !!(isProUser(store) && store.license?.isTrial);
};

/** User that has an expired trial license */
export const isExpiredTrialUser = (store: State): boolean => {
  return !!(store.license?.isTrial && store.license.isExpired);
};

/** User that is apart of an organization, usually provisioned through SAML/SSO */
export const isEnterpriseUser = ({ user: { user } }: State): boolean =>
  typeof user?.organizationId === 'number';

/** User that is apart of an organization, usually provisioned through SAML/SSO */
const getOrganizationRole = ({ user: { user } }: State) =>
  user?.organizationRole;

/**
 * Checkes to see if the user is an organizational administrator, important to distinguish from a
 * Pro user, as it's possible that the admin may not have a license assigned to them, but has access to the organization page.
 */
export const isOrganizationAdmin = createSelector(
  [isEnterpriseUser, getOrganizationRole],
  (isEnterpriseUser, organizationRole) =>
    isEnterpriseUser && organizationRole === 'admin',
);

export const hasOwnSubscriptions = (store: State): boolean => {
  return !!store.payments.subscriptions.length;
};
