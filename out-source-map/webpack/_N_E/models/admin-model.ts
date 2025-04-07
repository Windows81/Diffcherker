import axios, { AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import { Subscription, SubscriptionStatusType } from 'types/subscription';

export const addManualSubscription = async (data: {
  idOrEmail: string;
  planId: string;
  price: number;
  quantity: number;
  paidThroughDate: string;
  autoRenew?: boolean;
}): Promise<AxiosResponse<Subscription>> => {
  return await axios.post(createApiUrl('/admin/manual-subscription'), data);
};

export const findManualSubscriptions = async (
  idOrEmail: string,
): Promise<AxiosResponse<Subscription[]>> => {
  return await axios.get(createApiUrl('/admin/find-manual-subscriptions'), {
    params: { idOrEmail },
  });
};

export const updateManualSubscription = async (
  subscriptionId: string,
  data: {
    paidThroughDate: string;
    numOfLicenses: number;
    status: SubscriptionStatusType;
  },
): Promise<AxiosResponse<Subscription>> => {
  return await axios.patch(
    createApiUrl(`/admin/manual-subscription/${subscriptionId}`),
    data,
  );
};
