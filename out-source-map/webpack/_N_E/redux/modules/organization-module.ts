import * as organizationModel from 'models/organization-model';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import formatNetworkError from 'lib/format-network-error';
import { type Organization, type SamlConfiguration } from 'types/organization';

export const prefix = 'organization';

export type OrganizationState = Readonly<{
  samlSsoConfigured: boolean;
  organization: Organization | null;
}>;

export const initialState: OrganizationState = {
  samlSsoConfigured: false,
  organization: null,
};

export const getMine = createAsyncThunk(
  `${prefix}/getMine`,
  async (_, { rejectWithValue }) => {
    try {
      const response = await organizationModel.getMine();
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const setSamlConfiguration = createAsyncThunk(
  `${prefix}/setSamlConfiguration`,
  async (samlConfiguration: SamlConfiguration, { rejectWithValue }) => {
    try {
      const response =
        await organizationModel.setSamlConfiguration(samlConfiguration);
      return response.data;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const clearSamlConfiguration = createAsyncThunk(
  `${prefix}/clearSamlConfiguration`,
  async (_, { rejectWithValue }) => {
    try {
      await organizationModel.clearSamlConfiguration();
      return {
        samlCertificate: '',
        samlIssuer: '',
        samlEntryPoint: '',
      };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const organizationSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getMine.fulfilled, (_, action) => {
      const organization = action.payload;
      const samlSsoConfigured = !!(
        organization.samlCertificate &&
        organization.samlEntryPoint &&
        organization.samlIssuer
      );

      return {
        samlSsoConfigured,
        organization,
      };
    });
    builder.addCase(setSamlConfiguration.fulfilled, (state, action) => {
      if (!state.organization) {
        return;
      }
      state.organization = {
        ...state.organization,
        samlCertificate: action.payload.samlCertificate,
        samlIssuer: action.payload.samlIssuer,
        samlEntryPoint: action.payload.samlEntryPoint,
      };

      state.samlSsoConfigured = !!(
        state.organization.samlCertificate &&
        state.organization.samlEntryPoint &&
        state.organization.samlIssuer
      );
    });

    builder.addCase(clearSamlConfiguration.fulfilled, (state, action) => {
      if (!state.organization) {
        return;
      }
      state.organization = {
        ...state.organization,
        samlCertificate: action.payload.samlCertificate,
        samlIssuer: action.payload.samlIssuer,
        samlEntryPoint: action.payload.samlEntryPoint,
      };
      state.samlSsoConfigured = false;
    });
  },
});

const organizationReducer = organizationSlice.reducer;
export default organizationReducer;
