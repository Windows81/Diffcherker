import * as PaymentsModel from 'models/payments-model';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import formatNetworkError from 'lib/format-network-error';
import updateObjectInArray from 'lib/update-object-in-array';
import { type Card } from 'models/payments-model';
import { HYDRATE } from 'next-redux-wrapper';
import { type HydrateAction } from 'types/hydrateAction';
import { type Subscription } from 'types/subscription';
import { type OurTransaction } from 'types/transaction';
import { type Trial } from 'types/trial';

import { getCurrentUser, logout } from './user-module';
import Tracking from 'lib/tracking';
import { unassignLicense } from './license-module';
import { License } from 'types/license';
import { OurPaymentMethod } from 'types/payment-method';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type PaymentsState = Readonly<{
  trial?: Trial;
  transaction?: OurTransaction;
  subscriptions: Subscription[];
  paymentMethods: OurPaymentMethod[];
  isHydrated: boolean;
  subscriptionsStatus: RequestStatus;
  subscriptionsError?: string | null;
}>;

export const initialState: PaymentsState = {
  transaction: undefined,
  subscriptions: [],
  paymentMethods: [],
  subscriptionsStatus: 'idle',
  isHydrated: false,
};

const updateExistingSubscription = (
  state: PaymentsState,
  id: string,
  patch: object,
) => {
  const existingSubscriptionIndex = state.subscriptions.findIndex(
    (subscription) => {
      return subscription.id === id;
    },
  );
  return {
    ...state,
    subscriptions: updateObjectInArray(state.subscriptions, {
      index: existingSubscriptionIndex,
      item: {
        ...state.subscriptions[existingSubscriptionIndex],
        ...patch,
        transactionsLoaded: true,
      },
    }),
  };
};

const prefix = 'payments';

export const getClientToken = createAsyncThunk(
  `${prefix}/getClientToken`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.getClientToken();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const createSubscription = createAsyncThunk(
  `${prefix}/createSubscription`,
  async (
    params: {
      paymentMethodNonce?: string;
      paymentMethodToken?: string;
      deviceData?: string;
      planId: string;
      quantity: number;
      renewAutomatically: boolean;
      discountId?: string;
      purchaseCode?: string;
      card?: Card;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await PaymentsModel.createSubscription(params);

      // Update the user so we have the latest user meta data (such as planTier), no need to wait.
      dispatch(getCurrentUser());

      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const patchSubscription = createAsyncThunk(
  `${prefix}/patchSubscription`,
  async (
    {
      subscriptionId,
      attributes,
    }: { subscriptionId: string; attributes: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const response = await PaymentsModel.patchSubscription(
        subscriptionId,
        attributes,
      );
      return { data: response.data, subscriptionId };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const deleteAllSubsLicensesTrials = createAsyncThunk(
  `${prefix}/deleteAllSubsLicensesTrials`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.deleteAllSubsLicensesTrials();
      return { data: response.data, subscriptionId: response.data.id };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getMyPaymentMethods = createAsyncThunk(
  `${prefix}/getMyPaymentMethods`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.getMyPaymentMethods();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getMySubscriptions = createAsyncThunk(
  `${prefix}/getMySubscriptions`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.getMySubscriptions();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getTransactionsForSubscription = createAsyncThunk(
  `${prefix}/getTransactionsForSubscription`,
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response =
        await PaymentsModel.getTransactionsForSubscription(subscriptionId);
      return { subscriptionId, data: response.data };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getTransaction = createAsyncThunk(
  `${prefix}/getTransaction`,
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.getTransaction(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const createTrial = createAsyncThunk(
  `${prefix}/createTrial`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.createTrial();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getMyTrial = createAsyncThunk(
  `${prefix}/getMyTrial`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.getMyTrial();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const adminExtendTrial = createAsyncThunk(
  `${prefix}/adminExtendTrial`,
  async (
    {
      userId,
      newExpiresAt,
    }: {
      userId: string;
      newExpiresAt: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await PaymentsModel.adminExtendTrial({
        userId,
        newExpiresAt,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getPaymentMethodForSubscription = createAsyncThunk(
  `${prefix}/getPaymentMethodForSubscription`,
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response =
        await PaymentsModel.getPaymentMethodForSubscription(subscriptionId);
      return { subscriptionId, data: response.data };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const updatePaymentMethodForSubscription = createAsyncThunk(
  `${prefix}/updatePaymentMethodForSubscription`,
  async (
    {
      subscriptionId,
      method,
    }: {
      subscriptionId: string;
      method: PaymentsModel.Payload;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await PaymentsModel.updatePaymentMethodForSubscription(
        subscriptionId,
        method,
      );

      await dispatch(getMyPaymentMethods());

      return { subscriptionId, data: response.data };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const renewSubscription = createAsyncThunk(
  `${prefix}/renewSubscription`,
  async (
    {
      subscriptionId,
      method,
    }: {
      subscriptionId: string;
      method?: PaymentsModel.Payload;
    },
    { rejectWithValue, dispatch },
  ) => {
    const alsoUpdatePayment = !!method;

    const tryEvent = alsoUpdatePayment
      ? 'Tried changing and renewing'
      : 'Tried renewing';
    const successEvent = alsoUpdatePayment
      ? 'Succeeded changing and renewing'
      : 'Succeeded renewing';
    const failEvent = alsoUpdatePayment
      ? 'Failed changing and renewing'
      : 'Failed renewing';
    try {
      Tracking.trackEvent(tryEvent);
      await PaymentsModel.renewSubscription(subscriptionId, method);
      Tracking.trackEvent(successEvent);

      // Update the state of the subscriptions
      await dispatch(getMySubscriptions());

      return { subscriptionId };
    } catch (error) {
      Tracking.trackEvent(failEvent, { error });
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const addLicenses = createAsyncThunk(
  `${prefix}/addLicenses`,
  async (
    {
      subscriptionId,
      quantity,
      method,
    }: {
      subscriptionId: string;
      quantity: number;
      method: PaymentsModel.Payload;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await PaymentsModel.addLicenses(subscriptionId, quantity, method);

      // Update the state of the subscriptions
      await dispatch(getMySubscriptions());

      return { subscriptionId };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const deletePaymentMethodForSubscription = createAsyncThunk(
  `${prefix}/deletePaymentMethodForSubscription`,
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response =
        await PaymentsModel.deletePaymentMethodForSubscription(subscriptionId);
      return { subscriptionId, data: response.data };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const extendTrialForFeedback = createAsyncThunk(
  `${prefix}/extendTrialForFeedback`,
  async (extendToken: string, { rejectWithValue }) => {
    try {
      const response = await PaymentsModel.extendTrialForFeedback(extendToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const paymentsSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createSubscription.fulfilled, (state, action) => {
      state.subscriptions = [...(state.subscriptions ?? []), action.payload]; // TODO: look into if this is correct
    });
    builder.addCase(patchSubscription.fulfilled, (state, action) => {
      return updateExistingSubscription(
        state,
        action.payload.subscriptionId,
        action.payload.data,
      );
    });
    builder.addCase(deleteAllSubsLicensesTrials.fulfilled, (state, action) => {
      return updateExistingSubscription(
        state,
        action.payload.subscriptionId,
        action.payload.data,
      );
    });

    builder.addCase(getMySubscriptions.pending, (state, _action) => {
      state.subscriptionsStatus = 'loading';
    });
    builder.addCase(getMySubscriptions.fulfilled, (state, action) => {
      state.subscriptions = action.payload;
      state.subscriptionsStatus = 'succeeded';
    });

    builder.addCase(getMySubscriptions.rejected, (state, action) => {
      state.subscriptions = [];
      state.subscriptionsStatus = 'failed';
      state.subscriptionsError = action.error.message;
    });

    builder.addCase(getMyPaymentMethods.fulfilled, (state, action) => {
      state.paymentMethods = action.payload;
    });

    builder.addCase(
      getTransactionsForSubscription.fulfilled,
      (state, action) => {
        return updateExistingSubscription(
          state,
          action.payload.subscriptionId,
          {
            transactions: action.payload.data,
          },
        );
      },
    );

    builder.addCase(getTransaction.fulfilled, (state, action) => {
      state.transaction = action.payload;
    });
    builder.addCase(createTrial.fulfilled, (state, action) => {
      state.trial = action.payload;
    });
    builder.addCase(getMyTrial.fulfilled, (state, action) => {
      state.trial = action.payload;
    });
    builder.addCase(
      getPaymentMethodForSubscription.fulfilled,
      (state, action) => {
        return updateExistingSubscription(
          state,
          action.payload.subscriptionId,
          {
            paymentMethod: action.payload.data,
          },
        );
      },
    );
    builder.addCase(
      updatePaymentMethodForSubscription.fulfilled,
      (state, action) => {
        return updateExistingSubscription(
          state,
          action.payload.subscriptionId,
          {
            paymentMethod: action.payload.data,
          },
        );
      },
    );

    builder.addCase(
      deletePaymentMethodForSubscription.fulfilled,
      (state, action) => {
        return updateExistingSubscription(
          state,
          action.payload.subscriptionId,
          {
            paymentMethod: undefined,
          },
        );
      },
    );

    builder.addCase(extendTrialForFeedback.fulfilled, (state, action) => {
      state.trial = action.payload;
    });
    builder.addCase(logout.fulfilled, () => {
      return { ...initialState };
    });
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      return {
        ...state,
        ...action.payload.payments,
        isHydrated: true,
      };
    });

    builder.addCase(unassignLicense.fulfilled, (state, action) => {
      const licenses = state.subscriptions.reduce(
        (acc, subscriptions) => [...acc, ...(subscriptions.licenses ?? [])],
        [] as Array<License>,
      );

      const license = licenses.find((l: License) => l.id === action.payload.id);
      if (license) {
        license.userId = undefined;
        license.user = undefined;
        license.key = action.payload.key;
      }
    });
  },
});

export const actions = paymentsSlice.actions;
const paymentsReducer = paymentsSlice.reducer;
export default paymentsReducer;
