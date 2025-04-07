import * as ApiModel from 'models/api-model';
import * as LicenseModel from 'models/license-model';
import * as UserModel from 'models/user-model';
import { createAsyncThunk, createSlice, createAction } from '@reduxjs/toolkit';
import { addDays, differenceInDays } from 'date-fns';
import formatNetworkError from 'lib/format-network-error';
import getNetworkErrorCode from 'lib/get-network-error-code';
import { HYDRATE } from 'next-redux-wrapper';
import { State, type AppDispatch } from 'redux/store';
import { type HydrateAction } from 'types/hydrateAction';
import { type License } from 'types/license';
import { getCurrentUser, login, logout, signup } from './user-module';
import { getMySubscriptions } from './payments-module';
import eql from 'fast-deep-equal';
import yn from 'yn';

export const perpetualLicense = {
  valid: true,
  licenseKeyInitiallyValidated: true,
  isExpired: false,
  expiresAt: addDays(new Date(), 35600).toISOString(),
  maxMachines: 999999,
  key: 'PERPETUAL_KEY',
  error: false,
  isRevoked: false,
  isTrial: false,
  validationCode: 'PERPETUAL_VALIDATION_CODE',
  purchaseCode: 'PERPETUAL_VALIDATION_PURCHASE_CODE',
  isHydrated: true,
  licenses: [],
};

export type LicenseState = Readonly<
  Partial<License> & {
    error: boolean;
    licenseKeyInitiallyValidated: boolean;
    valid: boolean;
    licenses: License[];
    validationCode?: string;
    isHydrated: boolean;
    isOfflineLicense?: boolean;
  }
>;

export const initialState: LicenseState = {
  error: false,
  licenseKeyInitiallyValidated: false,
  valid: false,
  key: undefined,
  licenses: [],
  maxMachines: undefined,
  isRevoked: undefined,
  isExpired: undefined,
  expiresAt: undefined,
  validationCode: undefined,
  isHydrated: false,
  isOfflineLicense: false,
};

const prefix = 'license';

export function validateKeyOnStart(key: string) {
  return async (dispatch: AppDispatch) => {
    try {
      await ApiModel.checkStatus();
      await dispatch(validateKey({ key })).unwrap();
    } catch (error) {
      const code = getNetworkErrorCode(error, { allowUndefined: true });
      if (!code) {
        // error.code is not present => it is network error => assume the license is valid
        return;
      }
      await dispatch(licenseSlice.actions.setError(code));
    }
  };
}

export const validateKey = createAsyncThunk(
  `${prefix}/validateKey`,
  async (
    {
      key,
      fingerprint,
      validateUnassigned = false,
    }: { key: string; fingerprint?: string; validateUnassigned?: boolean },
    { rejectWithValue, getState },
  ) => {
    try {
      const response = await LicenseModel.validateKey(key, fingerprint);
      if (!response.data || !response.data.license) {
        return rejectWithValue({ code: 'FIREWALL_ISSUES' });
      }
      const { license, valid } = response.data;

      let firstLoggedIn = +new Date();
      const differentLicense =
        (getState() as State).license?.key !== license?.key;
      if (differentLicense) {
        firstLoggedIn = window.store?.get('global.firstLoggedIn');
        const allowedToUseMoreTrials = firstLoggedIn
          ? differenceInDays(new Date(), firstLoggedIn) <= 60
          : true;
        if (license.isTrial && !allowedToUseMoreTrials) {
          return rejectWithValue({ code: 'TRYING_TO_DOUBLE_UP_ON_TRIALS' });
        }
      }

      if (validateUnassigned && !!license.userId) {
        return rejectWithValue({
          code: `This license has already been assigned`,
        });
      }
      if (window.store) {
        setLicenseIfDifferent(license, valid, firstLoggedIn);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const setLicenseIfDifferent = (
  license: License,
  valid: boolean,
  firstLoggedIn: number | undefined,
) => {
  const storeLicense = window.store.get('license');
  if (!eql(storeLicense, { ...license, valid })) {
    window.store?.set({
      license: { ...license, valid },
      firstLoggedIn: firstLoggedIn || +new Date(),
    });
  }
};

export const getLicenses = createAsyncThunk(
  `${prefix}/getLicenses`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await LicenseModel.getLicenses();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const assignLicense = createAsyncThunk(
  `${prefix}/assignLicense`,
  async (licenseKey: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await UserModel.assignLicense(licenseKey);
      await dispatch(getCurrentUser());
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const unassignLicense = createAsyncThunk(
  `${prefix}/unassignLicense`,
  async (licenseId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await LicenseModel.unassignLicense(licenseId);
      await dispatch(getMySubscriptions());
      return {
        id: licenseId,
        key: response.data.key,
      };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getMyLicense = createAsyncThunk(
  `${prefix}/getMyLicense`,
  async (
    options: { desktopOnly?: boolean } | undefined,
    { rejectWithValue },
  ) => {
    const { desktopOnly } = options || {};
    try {
      const response = await LicenseModel.getMyLicense(desktopOnly).then(
        (result) => {
          const { license } = result.data;
          if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
            window.store.set('license', { ...license, valid: true });
          }
          return result;
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const licenseSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {
    makeLicensePerpetual: yn(process.env.PERPETUAL_BUILD)
      ? (state) => {
          window.store.set('license', perpetualLicense);
          return {
            ...state,
            ...perpetualLicense,
          };
        }
      : () => undefined,
    clearLicense: (state) => {
      window.store.set('license', {
        ...initialState,
        validationCode: state.validationCode,
      });
      return { ...initialState, validationCode: state.validationCode };
    },
    setError: (state, action) => {
      window.store.set('license', {
        ...initialState,
        error: true,
        validationCode: action.payload,
      });
      state.error = true;
      state.validationCode = action.payload;
    },
    setLicenseFromBrowser: (_, action) => {
      const license = action.payload;

      window.store.set('license', { ...license, valid: true });

      return {
        ...initialState,
        ...license,
        valid: true,
        licenseKeyInitiallyValidated: true,
        validationCode: action.payload.code,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(validateKey.pending, (state) => {
      state.validationCode = undefined;
    });
    builder.addCase(validateKey.fulfilled, (_, action) => {
      return {
        ...initialState,
        ...action.payload.license,
        valid: action.payload.valid,
        licenseKeyInitiallyValidated: true,
        validationCode: action.payload.code,
      };
    });
    builder.addCase(validateKey.rejected, (state, action) => {
      state.validationCode = action.error.code;
    });
    builder.addCase(getMyLicense.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload.license,
        valid: true,
        licenseKeyInitiallyValidated: true,
      };
    });
    builder.addCase(getLicenses.pending, (state) => {
      state.licenses = [];
    });
    builder.addCase(getLicenses.fulfilled, (state, action) => {
      state.licenses = action.payload;
    });
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      // On the electron app, the client store is inited with relevant data that server store doesn't have.
      // We don't want to override client store data in that case, so we do this check.
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        return {
          ...state,
          isHydrated: true,
        };
      }

      return {
        ...state,
        ...action.payload.license,
        isHydrated: true,
      };
    });
    builder.addCase(getCurrentUser.fulfilled, (state, action) => {
      return {
        ...state,
        ...(action.payload.license || {}),
      };
    });
    builder.addCase(login.fulfilled, (state, action) => {
      return {
        ...state,
        ...(action.payload.user.license || {}),
      };
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      return {
        ...state,
        ...(action.payload.user.license || {}),
      };
    });
    builder.addCase(logout.fulfilled, () => {
      return { ...initialState };
    });
    builder.addCase(unassignLicense.fulfilled, (state, action) => {
      const license = state.licenses.find(
        (l: License) => l.id === action.payload.id,
      );
      if (license) {
        license.userId = undefined;
        license.user = undefined;
        license.key = action.payload.key;
      }
    });
  },
});

const extraActions = {
  validateKeyPending: createAction(`${prefix}/validateKey/pending`),
  validateKeyFulfilled: createAction(`${prefix}/validateKey/fulfilled`),
  validateKeyRejected: createAction(`${prefix}/validateKey/rejected`),
};

export const actions = { ...licenseSlice.actions, ...extraActions };
const licenseReducer = licenseSlice.reducer;
export default licenseReducer;
