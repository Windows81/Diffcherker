import * as DiffModel from 'models/diff-model';
import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';

import formatNetworkError from 'lib/format-network-error';
import { getItem, setItem } from 'lib/local-storage';
import { DiffLevel } from 'types/normalize';
import normalize from 'lib/normalize';
import { HYDRATE } from 'next-redux-wrapper';
import { type Diff } from 'types/diff';
import { type HydrateAction } from 'types/hydrateAction';
import { type NetworkError } from 'types/network-error';
import { type CommentThread } from 'types/comment-thread';
import { type Comment } from 'types/comment';
import { type TextDiffOutputSettingsObject } from 'components/new/text-diff-output/settings';

const prefix = 'diff';

// the num of chars we normalize on server before offloading rest to client
// for more context: https://github.com/checkersoftware/diffchecker-web/pull/251
const SERVER_DIFF_CHAR_COUNT = 25000;

export type SavedDiff = Diff & {
  slug: string;
};

export const initialDiffState: Diff = {
  slug: undefined,
  title: undefined,
  expires: undefined,
  left: undefined,
  right: undefined,
  added: undefined,
  removed: undefined,
  createdAt: undefined,
  user: undefined,
  localTime: undefined,
  syntaxHighlight: undefined,
  rows: [],
  blocks: [],
  fullyNormalized: true,
  ip: undefined,
};

export type DiffState = Readonly<{
  sidebarTab: 'settings' | 'history' | 'comments';
  expiry: string; // TODO what are options for this besides 'no'
  diffIndex: number;
  diffs: Diff[];
  errorCode?: string;
  diffLevel: DiffLevel;
  syntaxHighlight: string;
  localTime?: Date;
  isHydrated: boolean;
  textDiffOutputSettings: TextDiffOutputSettingsObject;
  commentThreads: CommentThread[];
  commentThreadsLoadedForSlug: string;
}>;

export const initialState: DiffState = {
  sidebarTab: 'settings',
  expiry: 'no',
  diffIndex: -1,
  diffs: [],
  diffLevel: 'word',
  syntaxHighlight: '',
  isHydrated: false,
  commentThreads: [],
  commentThreadsLoadedForSlug: '',
  textDiffOutputSettings: {
    diffVersion: 'regular',
    diffType: 'split',
    diffCompression: 'expanded',
    diffLevel: 'word',
    syntaxHighlight: '',
  },
};

export const deleteSecretDiff = createAsyncThunk(
  `${prefix}/deleteSecretDiff`,
  async (params: { secretKey: string; slug: string }, { rejectWithValue }) => {
    // slug only used to delete local recent diff history, not the database stored diff (i.e. no security leak)
    try {
      const response = await DiffModel.del(params);
      return {
        ...response.data,
        secretKey: params.secretKey,
        slug: params.slug,
      };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const deleteDiff = createAsyncThunk(
  `${prefix}/deleteDiff`,
  async (params: { slug: string }, { rejectWithValue }) => {
    try {
      const response = await DiffModel.del(params);
      return { ...response.data, slug: params.slug };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getDiff = createAsyncThunk<
  { diff: Diff & { secretKey?: string }; calledOnServer: boolean },
  {
    slug: string;
    calledOnServer: boolean;
    cookie?: string;
    secretKey?: string;
  },
  { rejectValue: NetworkError }
>(
  `${prefix}/getDiff`,
  async (
    // TODO should try to improve typing for axios methods (but requires types from backend)
    { slug, calledOnServer, cookie, secretKey },
    { rejectWithValue },
  ) => {
    try {
      const res = await DiffModel.get(slug, cookie);
      return {
        diff: { ...res.data, secretKey },
        calledOnServer,
      };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const getCommentThreads = createAsyncThunk<
  CommentThread[],
  { slug: string }
>(`${prefix}/getCommentThreads`, async (params, { rejectWithValue }) => {
  // slug only used to delete local recent diff history, not the database stored diff (i.e. no security leak)
  try {
    const response = await DiffModel.getCommentThreads(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const loadCommentsForThread = createAsyncThunk<
  Comment[],
  { slug: string; lineNumber: number; side: 'left' | 'right' }
>(`${prefix}/loadCommentsForThread`, async (params, { rejectWithValue }) => {
  // slug only used to delete local recent diff history, not the database stored diff (i.e. no security leak)
  try {
    const response = await DiffModel.loadCommentsForThread(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const createComment = createAsyncThunk<
  Comment,
  { slug: string; lineNumber: number; side: 'left' | 'right'; contents: string }
>(`${prefix}/createComment`, async (params, { rejectWithValue }) => {
  try {
    const response = await DiffModel.createComment(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const deleteComment = createAsyncThunk<
  Comment[],
  { slug: string; comment: Comment }
>(`${prefix}/deleteComment`, async (params, { rejectWithValue }) => {
  try {
    const { slug, comment } = params;
    await DiffModel.deleteComment({ commentUuid: comment.uuid, slug });

    const response = await DiffModel.loadCommentsForThread({
      lineNumber: comment.lineNumber,
      side: comment.side,
      slug,
    });

    return response.data;
  } catch (error) {
    return rejectWithValue(formatNetworkError(error));
  }
});

export const storeDiff = createAsyncThunk(
  `${prefix}/storeDiff`,
  async (diff: Diff, { rejectWithValue }) => {
    try {
      // TODO should try to improve typing for axios methods (but requires types from backend)
      const { data, ...rest } = await DiffModel.create(diff);
      return {
        data: {
          ...data,
          user: diff.user,
        },
        ...rest,
      };
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const patchSharing = createAsyncThunk(
  `${prefix}/patchSharing`,
  async (
    diff: Pick<Diff, 'slug' | 'isPrivate' | 'collaborators' | 'permission'>,
    { rejectWithValue },
  ) => {
    try {
      await DiffModel.patchSharing(diff);
      return diff;
    } catch (error) {
      return rejectWithValue(formatNetworkError(error));
    }
  },
);

export const diffSlice = createSlice({
  name: prefix,
  initialState,
  reducers: {
    applySettings: (
      state,
      action: PayloadAction<TextDiffOutputSettingsObject>,
    ) => {
      state.textDiffOutputSettings = action.payload;
    },
    updateDiff: (state, action: PayloadAction<Partial<Diff>>) => {
      state.diffs = state.diffs.map((diff, i) =>
        i === state.diffIndex
          ? {
              ...diff,
              ...action.payload,
            }
          : diff,
      );
    },
    clearDiff: (state) => {
      state.diffIndex = -1;
      state.expiry = 'no';
    },
    clearDiffs: (state) => {
      if (state.diffIndex === -1) {
        state.diffs = [];
      } else {
        state.diffs = state.diffs.slice(state.diffIndex, state.diffIndex + 1);
        state.diffIndex = 0;
      }
    },
    addDiff: (state, action: PayloadAction<Diff>) => {
      state.diffs.push({
        ...action.payload,
        localTime: Date.now(),
        fullyNormalized: true,
      });
      state.diffIndex = state.diffs.length - 1;
    },
    createDiff: (state, action: PayloadAction<Diff>) => {
      const { left, right } = action.payload;
      if (left === undefined || right === undefined) {
        return;
      }

      const diffLevel = state.textDiffOutputSettings.diffLevel;
      const normalizeData = normalize(left, right, diffLevel);

      state.diffs.push({
        ...action.payload,
        localTime: Date.now(),
        ...normalizeData,
        diffLevel,
        fullyNormalized: true,
      });
      state.diffIndex = state.diffs.length - 1;
    },
    replaceDiff: (
      state,
      action: PayloadAction<
        Partial<Diff> & {
          // mandatory props
          left: string;
          right: string;
        }
      >,
    ) => {
      const diffLevel = state.textDiffOutputSettings.diffLevel;
      const normalizeData = normalize(
        action.payload.left,
        action.payload.right,
        diffLevel,
      );

      state.diffs = state.diffs.map((diff, i) =>
        i === state.diffIndex
          ? {
              ...diff,
              ...action.payload,
              ...normalizeData,
              diffLevel,
              fullyNormalized: true,
            }
          : diff,
      );
    },
    chooseDiff: (state, action: PayloadAction<number>) => {
      if (action.payload < state.diffs.length) {
        state.diffIndex = action.payload;
      }
    },
    clearErrors: (state) => {
      state.errorCode = undefined; // TODO this was null before, sth might break
    },
    setDiffLevel: (state, action: PayloadAction<DiffState['diffLevel']>) => {
      state.diffLevel = action.payload;
    },
    setSidebarTab: (state, action: PayloadAction<DiffState['sidebarTab']>) => {
      state.sidebarTab = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getDiff.fulfilled, (state, action) => {
      const { diff, calledOnServer } = action.payload;
      let left = diff.left as string;
      let right = diff.right as string;
      let fullyNormalized = true;

      const textIsLong =
        left.length > SERVER_DIFF_CHAR_COUNT ||
        right.length > SERVER_DIFF_CHAR_COUNT;
      const shouldPartiallyNormalize = calledOnServer && textIsLong;
      if (shouldPartiallyNormalize) {
        // don't normalize all text; rest will be normalized on client
        left = left.substring(0, SERVER_DIFF_CHAR_COUNT);
        right = right.substring(0, SERVER_DIFF_CHAR_COUNT);
        fullyNormalized = false;
      }

      const diffLevel = state.textDiffOutputSettings.diffLevel;
      const normalizeData = normalize(left, right, diffLevel);

      state.diffs.push({
        ...diff,
        localTime: Date.now(),
        ...normalizeData,
        fullyNormalized,
        diffLevel,
      });
      state.diffIndex = state.diffs.length - 1;
    });
    builder.addCase(getDiff.rejected, (state, action) => {
      state.diffIndex = -1;
      state.errorCode = action.payload?.code;
    });
    builder.addCase(storeDiff.fulfilled, (state, action) => {
      const { left, right, secretKey, slug, expires, title } =
        action.payload.data;
      if (left === undefined || right === undefined) {
        return;
      }

      const diffLevel = state.textDiffOutputSettings.diffLevel;
      const normalizeData = normalize(left, right, diffLevel);

      state.expiry = 'no';
      state.diffs.push({
        ...action.payload.data,
        localTime: Date.now(),
        ...normalizeData,
        diffLevel,
        fullyNormalized: true, // TODO may produce bugs if we ever store unfull diff
        areCommentThreadsLoaded: true,
      });
      state.diffIndex = state.diffs.length - 1;
      if (secretKey !== null) {
        const locallyStoredDiffs = JSON.parse(getItem('secretKeys') || '[]');
        locallyStoredDiffs.push({ secretKey, expires, slug, title });
        setItem('secretKeys', JSON.stringify(locallyStoredDiffs));
      }
    });
    // builder.addCase(storeDiff.rejected, (state, action) => {
    //   // TODO handle this case?
    // });
    builder.addCase(deleteSecretDiff.fulfilled, (state, action) => {
      state.diffIndex = -1;
      // erase saved diff from recent diffs if it exists
      state.diffs = state.diffs.filter((diff) => {
        return diff.slug !== action.payload.slug;
      });
    });
    builder.addCase(deleteDiff.fulfilled, (state, action) => {
      state.diffIndex = -1;
      // erase saved diff from recent diffs if it exists
      state.diffs = state.diffs.filter((diff) => {
        return diff.slug !== action.payload.slug;
      });
    });
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      return {
        ...state,
        ...action.payload.diff, // server store state
        isHydrated: true, // indicate that we've hydrated
      };
    });
    builder.addCase(patchSharing.fulfilled, (state, action) => {
      const diff = state.diffs.findLast((d) => d.slug === action.payload.slug);
      if (!diff) {
        return;
      }
      diff.isPrivate = action.payload.isPrivate;
      diff.permission = action.payload.permission;
      diff.collaborators = action.payload.collaborators;
    });

    builder.addCase(getCommentThreads.fulfilled, (state, action) => {
      state.commentThreads = action.payload;
      state.commentThreadsLoadedForSlug = action.meta.arg.slug;
    });

    builder.addCase(loadCommentsForThread.fulfilled, (state, action) => {
      const { lineNumber, side } = action.meta.arg;

      if (state) {
        state.commentThreads = state.commentThreads ?? [];

        const thread = state.commentThreads.find(
          (commentThread) =>
            commentThread.side === side &&
            commentThread.lineNumber === lineNumber,
        );

        if (thread) {
          thread.loadedComments = action.payload;
          thread.areAllCommentsLoaded = true;
        }
      }
    });

    builder.addCase(createComment.fulfilled, (state, action) => {
      state.commentThreads = state.commentThreads ?? [];
      const { lineNumber, side } = action.meta.arg;

      const existingThread = state.commentThreads.find(
        (commentThread) =>
          commentThread.side === side &&
          commentThread.lineNumber === lineNumber,
      );

      const thread = !existingThread
        ? {
            lineNumber,
            side,
            commentCount: 0,
            loadedComments: [],
            areAllCommentsLoaded: true,
          }
        : existingThread;

      if (!existingThread) {
        state.commentThreads.push(thread);
      }

      thread.loadedComments?.push(action.payload);
      thread.commentCount++;
    });

    builder.addCase(deleteComment.fulfilled, (state, action) => {
      state.commentThreads = state.commentThreads ?? [];

      const { comment } = action.meta.arg;

      const thread = state.commentThreads.find(
        (commentThread) =>
          commentThread.side === comment.side &&
          commentThread.lineNumber === comment.lineNumber,
      );

      const comments = action.payload;

      if (thread) {
        if (thread.areAllCommentsLoaded) {
          thread.loadedComments = comments;
        } else {
          thread.loadedComments = [comments[0], comments[comments.length - 1]];
        }

        thread.commentCount = comments.length;

        if (comments.length <= 2) {
          thread.areAllCommentsLoaded = true;
        }
      }
    });
  },
});

export const actions = diffSlice.actions;

const diffReducer = diffSlice.reducer;
export default diffReducer;
