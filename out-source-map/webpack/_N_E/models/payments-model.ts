import axios, { type AxiosResponse } from 'axios';
import { CreateTransactionRequest } from 'components/buy/manual-payment-page';
import createApiUrl from 'lib/create-api-url';

export interface Payload {
  paymentMethodToken?: string;
  paymentMethodNonce?: string;
  deviceData?: string;
  card?: Card;
}

export interface Card {
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  region: string;
  postalCode: string;
}

export const getClientToken = async (): Promise<AxiosResponse> => {
  return await axios.get(createApiUrl(`/payments/client-token`));
};

export const createSubscription = async ({
  deviceData,
  paymentMethodNonce,
  paymentMethodToken,
  planId,
  quantity,
  renewAutomatically,
  discountId,
  purchaseCode,
  card,
}: {
  deviceData?: string;
  paymentMethodNonce?: string;
  paymentMethodToken?: string;
  planId: string;
  quantity: number;
  renewAutomatically: boolean;
  discountId?: string;
  purchaseCode?: string;
  card?: Card;
}) => {
  const alwaysParams = {
    deviceData,
    paymentMethodNonce,
    paymentMethodToken,
    planId,
    quantity,
    renewAutomatically,
    discountId,
    card,
  };
  const url = createApiUrl(`/payments/subscriptions`);
  if (purchaseCode) {
    return await axios.post(url, {
      ...alwaysParams,
      purchaseCode,
    });
  } else {
    return await axios.post(url, alwaysParams);
  }
};

export const patchSubscription = async (
  id: string,
  attributes: Record<string, unknown>,
) => {
  return await axios.patch(
    createApiUrl(`/payments/subscriptions/${id}`),
    attributes,
  );
};

export const deleteAllSubsLicensesTrials = async () => {
  return await axios.delete(createApiUrl(`/payments/subscriptions/delete-all`));
};

export const getMyPaymentMethods = async () => {
  return await axios.get(createApiUrl(`/payments/payment-methods/mine`));
};

export const getMySubscriptions = async () => {
  return await axios.get(createApiUrl(`/payments/subscriptions/mine`));
};

export const getTransactionsForSubscription = async (
  subscriptionId: string,
) => {
  return await axios.get(
    createApiUrl(`/payments/subscriptions/${subscriptionId}/transactions`),
  );
};

export const getTransaction = async (transactionId: string) => {
  return await axios.get(
    createApiUrl(`/payments/transactions/${transactionId}`),
  );
};

export const createTrial = async () => {
  return await axios.post(createApiUrl(`/trials`), {});
};

export const getMyTrial = async () => {
  return await axios.get(createApiUrl(`/trials/mine`));
};

export const adminExtendTrial = async ({
  userId,
  newExpiresAt,
}: {
  userId: string;
  newExpiresAt: string;
}) => {
  return await axios.patch(createApiUrl(`/trials`), {
    newExpiresAt,
    userId,
  });
};

export const getPaymentMethodForSubscription = async (
  subscriptionId: string,
) => {
  return await axios.get(
    createApiUrl(`/payments/subscriptions/${subscriptionId}/method`),
  );
};

export const updatePaymentMethodForSubscription = async (
  subscriptionId: string,
  { paymentMethodToken, paymentMethodNonce, deviceData, card }: Payload,
) => {
  return await axios.put(
    createApiUrl(`/payments/subscriptions/${subscriptionId}/method`),
    { paymentMethodToken, paymentMethodNonce, deviceData, card },
  );
};

export const deletePaymentMethodForSubscription = async (
  subscriptionId: string,
) => {
  return await axios.delete(
    createApiUrl(`/payments/subscriptions/${subscriptionId}/method`),
  );
};

export const extendTrialForFeedback = async (extendToken: string) => {
  return await axios.post(createApiUrl('/trials/actions/extend-for-feedback'), {
    extendToken,
  });
};

export const renewSubscription = async (
  id: string | number,
  options?: Payload,
) => {
  return await axios.post(createApiUrl(`/payments/subscriptions/${id}/renew`), {
    paymentMethodToken: options?.paymentMethodToken,
    paymentMethodNonce: options?.paymentMethodNonce,
    card: options?.card,
  });
};

export const upgradeProration = async (
  id: string,
  planId: string,
  quantity?: number,
) => {
  return await axios.get(
    createApiUrl(`/payments/subscriptions/${id}/upgrade-proration/${planId}`),
    { params: { quantity } },
  );
};

export const addLicenses = async (
  id: string,
  quantity: number,
  method: Payload,
) => {
  return await axios.post(
    createApiUrl(`/payments/subscriptions/${id}/add-licenses/`),
    { quantity, ...method },
  );
};

export const createTransaction = async ({
  paymentAmount,
  paymentMethodPayload,
  email,
}: CreateTransactionRequest) => {
  return await axios.post(createApiUrl(`/payments/transactions`), {
    paymentAmount,
    paymentMethodPayload,
    email,
  });
};
