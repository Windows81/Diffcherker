import * as FeedbackModel from 'models/feedback-model';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { type HydrateAction } from 'types/hydrateAction';

export type FeedbackState = Readonly<{
  error: boolean;
  success: boolean;
  isHydrated: boolean;
}>;

export const initialState: FeedbackState = {
  error: false,
  success: false,
  isHydrated: false,
};

const prefix = 'feedback';

export const createFeedback = createAsyncThunk(
  `${prefix}/getMe`,
  async (diff: Record<string, unknown>) => {
    const response = await FeedbackModel.create(diff);
    return response;
  },
);

export const feedbackSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createFeedback.fulfilled, (state) => {
      state.success = true;
      state.error = false;
    });
    builder.addCase(createFeedback.rejected, (state) => {
      state.error = false;
    });
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      return {
        ...state,
        ...action.payload.feedback,
        isHydrated: true,
      };
    });
  },
});

const feedbackReducer = feedbackSlice.reducer;
export default feedbackReducer;
