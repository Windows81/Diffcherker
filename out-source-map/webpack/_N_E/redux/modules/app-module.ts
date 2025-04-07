import {
  type PayloadAction,
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { type DiffCompression } from 'types/diffCompression';
import { type DiffVersion } from 'types/diffVersion';
import { type HydrateAction } from 'types/hydrateAction';
import * as AppConfigurationModel from 'models/app-configuration-model';

import { logout } from './user-module';
import formatNetworkError from 'lib/format-network-error';
import { Features } from 'types/features';

export type AppState = Readonly<{
  allowUsageDataCollection: boolean;
  diffVersion: DiffVersion;
  diffCompression: DiffCompression;
  features: Features;
  ip?: string;
  isHydrated: boolean;
}>;

export const initialState: AppState = {
  allowUsageDataCollection: true,
  diffVersion: 'regular',
  diffCompression: 'expanded',
  features: {},
  isHydrated: false,
};

const prefix = 'app';

export const fetchFeatures = createAsyncThunk(
  `${prefix}/fetchFeatures`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await AppConfigurationModel.fetchFeatures();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const updateFeatures = createAsyncThunk(
  `${prefix}/updateFeatures`,
  async (features: Features, { rejectWithValue }) => {
    try {
      const response = await AppConfigurationModel.updateFeatures(features);
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const appSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {
    initializeAppStore: (state) => {
      const app = window.store.get('app');
      const allowUsageDataCollection = app?.allowUsageDataCollection ?? true;
      const diffVersion = app?.diffVersion ?? 'regular';
      const diffCompression = app?.diffCompression ?? 'expanded';
      state.allowUsageDataCollection = allowUsageDataCollection;
      state.diffVersion = diffVersion;
      state.diffCompression = diffCompression;
    },

    toggleUsageDataCollectionAllowed: (state) => {
      const allowUsageDataCollection = !state.allowUsageDataCollection;
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.store.set(
          'app.allowUsageDataCollection',
          allowUsageDataCollection,
        );
      }
      state.allowUsageDataCollection = allowUsageDataCollection;
    },

    setDiffCompression: (state, action: PayloadAction<DiffCompression>) => {
      const diffCompression = action.payload;
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.store.set('app.diffCompression', diffCompression);
      }
      state.diffCompression = diffCompression;
    },

    setDiffVersion: (state, action: PayloadAction<DiffVersion>) => {
      const diffVersion = action.payload;
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.store.set('app.diffVersion', diffVersion);
      }
      state.diffVersion = diffVersion;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      // On the electron app, the client store has relevant data that server store doesn't have.
      // We don't want to override client store data in that case, so we do this.
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        return {
          ...state,
          isHydrated: true,
        };
      }

      return {
        ...state,
        ...action.payload.app,
        isHydrated: true,
      };
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.diffVersion = 'regular';
    });

    builder.addCase(fetchFeatures.fulfilled, (state, action) => {
      state.features = action.payload;
    });

    builder.addCase(updateFeatures.fulfilled, (state, action) => {
      state.features = action.payload;
    });
  },
});

export const actions = appSlice.actions;

const appReducer = appSlice.reducer;
export default appReducer;
