import * as UserModel from 'models/user-model';
import {
  type PayloadAction,
  createAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import formatNetworkError from 'lib/format-network-error';
import { getItem, setItem } from 'lib/local-storage';
import { HYDRATE } from 'next-redux-wrapper';
import { type AnonDiff } from 'types/anonDiff';
import { type DiffVersion } from 'types/diffVersion';
import { type HydrateAction } from 'types/hydrateAction';
import { type NetworkError } from 'types/network-error';
import { type User } from 'types/user';

import {
  type SavedDiff,
  deleteDiff,
  deleteSecretDiff,
  storeDiff,
} from './diff-module';
import { Customer } from 'chartmogul-node';

type Status = 'to be determined' | 'present' | 'not present';
export type DiffType = 'split' | 'unified';

export type UserState = Readonly<{
  id?: number | string;
  error: boolean;
  success: boolean;
  user?: User;
  diffs: SavedDiff[];
  secretDiffs: AnonDiff[];
  ip?: string;
  diffType: DiffType;
  diffVersion: DiffVersion;
  code?: string;
  loginErrorCode?: string;
  loginErrorField?: string;
  signupErrorCode?: string;
  signupErrorField?: string;
  resetPasswordErrorCode?: string;
  resetPasswordErrorField?: string;
  confirmResetPasswordErrorCode?: string;
  confirmResetPasswordErrorField?: string;
  deleteUserErrorCode?: string;
  status: Status;
  isHydrated: boolean;
}>;

export const initialState: UserState = {
  status: 'to be determined',
  error: false,
  success: false,
  diffs: [],
  secretDiffs: [],
  ip: undefined,
  diffType: 'split',
  diffVersion: process.env.NEXT_PUBLIC_IS_ELECTRON ? 'live' : 'regular',
  isHydrated: false,
};

const prefix = 'user';

export const login = createAsyncThunk<
  { user: User },
  { email?: string; password?: string },
  { rejectValue: NetworkError }
>(`${prefix}/login`, async (user, { rejectWithValue, dispatch }) => {
  let secretKeys: AnonDiff[];
  try {
    secretKeys = JSON.parse(getItem('secretKeys') || '[]');
  } catch (e) {
    // entering here means JSON.parse failed, i.e. the localStorage secretKey was (possibly maliciously) modified. We cancel anonymous diff transfer in this case.
    secretKeys = [];
  }
  try {
    const response = await UserModel.login({
      user,
      secretKeys,
    });

    if (response.status === 200) {
      // delete user's secret diffs if it was successfully moved to the account
      setItem('secretKeys', '[]');

      const authedUser = await dispatch(getCurrentUser()).unwrap();
      return { user: authedUser };
    }

    //TODO: Unsure if this return can even be hit
    return { user: response.data };
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const logout = createAsyncThunk<
  undefined,
  undefined,
  { rejectValue: NetworkError }
>(`${prefix}/logout`, async (_, { rejectWithValue }) => {
  try {
    await UserModel.logout();
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});
export const signup = createAsyncThunk<
  { user: User; chartMogulProfile?: Customer.Customer },
  {
    name?: string;
    email?: string;
    password?: string;
    recaptchaToken?: string;
  },
  { rejectValue: NetworkError }
>(`${prefix}/signup`, async (user, { rejectWithValue, dispatch }) => {
  let secretKeys: AnonDiff[];
  try {
    secretKeys = JSON.parse(getItem('secretKeys') || '[]');
  } catch (e) {
    // entering here means JSON.parse failed, i.e. the localStorage secretKey was (possibly maliciously) modified. We cancel anonymous diff transfer in this case.
    secretKeys = [];
  }
  try {
    const response = await UserModel.signup({
      user,
      secretKeys,
    });
    if (response.status === 200) {
      // delete user's secret diffs if it was successfully moved to the account
      setItem('secretKeys', '[]');

      const authedUser = await dispatch(getCurrentUser()).unwrap();
      return {
        user: authedUser,
      };
    }
    //TODO: Unsure if this return can even be hit
    return {
      user: response.data,
    };
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const deleteUser = createAsyncThunk<
  unknown,
  {
    idOrEmail: number | string;
    password?: string;
  },
  { rejectValue: NetworkError }
>(`${prefix}/deleteUser`, async (data, { rejectWithValue }) => {
  try {
    const response = await UserModel.deleteUser(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const resetPassword = createAsyncThunk<
  { code: string },
  { email?: string },
  { rejectValue: NetworkError }
>(`${prefix}/resetPassword`, async (data, { rejectWithValue }) => {
  try {
    const response = await UserModel.resetPassword(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const confirmResetPassword = createAsyncThunk<
  { user: User },
  { code: string; password?: string },
  { rejectValue: NetworkError }
>(
  `${prefix}/confirmResetPassword`,
  async (codeAndPassword, { rejectWithValue }) => {
    try {
      const response = await UserModel.confirmResetPassword(codeAndPassword);
      return { user: response.data };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const changeEmail = createAsyncThunk<
  unknown,
  { email?: string; password?: string },
  { rejectValue: NetworkError }
>(`${prefix}/changeEmail`, async (data, { rejectWithValue }) => {
  try {
    const response = await UserModel.changeEmail(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const changeName = createAsyncThunk<
  unknown,
  { name: string },
  { rejectValue: NetworkError }
>(`${prefix}/changeName`, async (data, { rejectWithValue }) => {
  try {
    const response = await UserModel.changeName(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const confirmChangeEmail = createAsyncThunk<
  { user: User },
  string,
  { rejectValue: NetworkError }
>(`${prefix}/confirmChangeEmail`, async (code, { rejectWithValue }) => {
  try {
    const response = await UserModel.confirmChangeEmail(code);
    return { user: response.data };
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const setTaxId = createAsyncThunk<
  string,
  string,
  { rejectValue: NetworkError }
>(`${prefix}/setTaxId`, async (taxId: string, { rejectWithValue }) => {
  try {
    await UserModel.setTaxId(taxId);
    return taxId;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const getCurrentUser = createAsyncThunk<
  User,
  string | undefined,
  { rejectValue: NetworkError }
>(`${prefix}/getCurrentUser`, async (cookies, { rejectWithValue }) => {
  try {
    const response = await UserModel.getCurrentUser(cookies);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const getDiffs = createAsyncThunk<
  SavedDiff[],
  { id: number | string },
  { rejectValue: NetworkError }
>(`${prefix}/getDiffs`, async (data, { rejectWithValue }) => {
  try {
    const response = await UserModel.getDiffs(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const clearSession = createAction(`${prefix}/clearSession`);

export const userSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {
    setDiffType: (state, action: PayloadAction<DiffType>) => {
      state.diffType = action.payload;
    },
    setSecretDiffs: (state, action: PayloadAction<AnonDiff[]>) => {
      state.secretDiffs = action.payload;
    },
    logoutDesktop: () => {
      window.store.delete('user');
      return { ...initialState };
    },
    clearSession: () => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (_, action) => {
      return { ...initialState, ...action.payload, status: 'present' };
    });
    builder.addCase(logout.fulfilled, () => {
      return { ...initialState, status: 'not present' };
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loginErrorCode = action.payload?.code;
      state.loginErrorField = action.payload?.field;
    });
    builder.addCase(signup.fulfilled, (_, action) => {
      return { ...initialState, ...action.payload, status: 'present' };
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.signupErrorCode = action.payload?.code;
      state.signupErrorField = action.payload?.field;
    });
    builder.addCase(resetPassword.fulfilled, (_, action) => {
      return { ...initialState, ...action.payload };
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.resetPasswordErrorCode = action.payload?.code;
      state.resetPasswordErrorField = action.payload?.field;
    });
    builder.addCase(confirmResetPassword.fulfilled, (_, action) => {
      return { ...initialState, ...action.payload, status: 'present' };
    });
    builder.addCase(confirmChangeEmail.fulfilled, (_, action) => {
      return { ...initialState, ...action.payload, status: 'present' };
    });
    builder.addCase(confirmResetPassword.rejected, (state, action) => {
      state.confirmResetPasswordErrorCode = action.payload?.code;
      state.confirmResetPasswordErrorField = action.payload?.field;
    });
    builder.addCase(setTaxId.fulfilled, (state, action) => {
      if (!state.user) {
        return;
      }
      state.user.taxId = action.payload;
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.deleteUserErrorCode = action.payload?.code;
    });
    builder.addCase(getCurrentUser.fulfilled, (_, action) => {
      return {
        ...initialState,
        user: action.payload,
        status: 'present',
      };
    });
    builder.addCase(getCurrentUser.rejected, (state) => {
      state.status = 'not present';
    });
    builder.addCase(getDiffs.fulfilled, (state, action) => {
      state.diffs = action.payload;
    });
    builder.addCase(deleteDiff.fulfilled, (state, action) => {
      const diffs = state.diffs.filter(
        (diff) => action.payload.slug !== diff.slug,
      );
      state.diffs = diffs;
    });
    builder.addCase(deleteSecretDiff.fulfilled, (state, action) => {
      const diffs = state.secretDiffs.filter(
        (diff) => action.payload.secretKey !== diff.secretKey,
      );
      state.secretDiffs = diffs;
      let locallyStoredDiffs: AnonDiff[] = JSON.parse(
        getItem('secretKeys') || '[]',
      );
      locallyStoredDiffs = locallyStoredDiffs.filter(
        (diff) => diff.secretKey !== action.payload.secretKey,
      );
      setItem('secretKeys', JSON.stringify(locallyStoredDiffs));
    });

    builder.addCase(storeDiff.fulfilled, (state, action) => {
      if (state.user) {
        state.diffs.unshift(action.payload.data);
      } else {
        const { slug, title, expires, secretKey } = action.payload.data;
        state.secretDiffs.push({ slug, title, expires, secretKey });
      }
    });
    builder.addCase(changeName.fulfilled, (state, action) => {
      if (state.user) {
        state.user.name = action.meta.arg.name;
      }
    });
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      return {
        ...state,
        ...action.payload.user,
        isHydrated: true,
      };
    });
  },
});
export const actions = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;
