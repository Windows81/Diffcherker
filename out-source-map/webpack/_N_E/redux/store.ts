import { configureStore } from '@reduxjs/toolkit';
import { setupAxios } from 'models/user-model';
import { merge } from 'ts-deepmerge';
import { createWrapper } from 'next-redux-wrapper';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux';
import abTestReducer, {
  type ABTestState,
  initialState as abTestInitialState,
} from 'redux/modules/ab-test-module';
import appReducer, {
  type AppState,
  initialState as appInitialState,
} from 'redux/modules/app-module';
import diffReducer, {
  type DiffState,
  initialState as diffInitialState,
} from 'redux/modules/diff-module';
import feedbackReducer, {
  type FeedbackState,
  initialState as feedbackInitialState,
} from 'redux/modules/feedback-module';
import licenseReducer, {
  type LicenseState,
  initialState as licenseInitialState,
} from 'redux/modules/license-module';
import paymentsReducer, {
  type PaymentsState,
  initialState as paymentsInitialState,
} from 'redux/modules/payments-module';
import userReducer, {
  type UserState,
  initialState as userInitialState,
} from 'redux/modules/user-module';
import organizationReducer, {
  type OrganizationState,
  initialState as organizationInitialState,
} from './modules/organization-module';

// StoreStateBlueprint is the shape of the store, explicitly defined so that deepMerge and preloadedState are typed correctly.
// After the store is created, we can use State to get the store's state type.
type StoreStateBlueprint = {
  abTest: ABTestState;
  app: AppState;
  diff: DiffState;
  feedback: FeedbackState;
  user: UserState;
  license: LicenseState;
  payments: PaymentsState;
  organization: OrganizationState;
};

/**
 * Notes:
 * - Previously during SERVER store generation, we would try to find and set the user ip in the store.
 *   However after refactoring the store to be written purely with redux-toolkit, we lost access to req/res contexts, so we don't do ip stuff here anymore.
 *   If we ever do want to do ip stuff again, we would probably do it in getInitialProps (in pages/_app).
 * - Every reducer has an 'isHydrated' prop that indicates whether its state has been hydrated on the client.
 *   We have this because we only want to hydrate once on initial page load, but next-redux-wrapper fires the HYDRATE
 *   action on every page nav. So by having this flag, we can avoid hydrating more than once and avoiding dirty overwrites.
 *   For more context: https://github.com/kirill-konshin/next-redux-wrapper/issues/280
 */
export const makeConfiguredStore = (
  additionalState: Partial<StoreStateBlueprint> = {},
) => {
  let preloadedState: StoreStateBlueprint = {
    abTest: abTestInitialState,
    app: appInitialState,
    diff: diffInitialState,
    feedback: feedbackInitialState,
    user: userInitialState,
    license: licenseInitialState,
    payments: paymentsInitialState,
    organization: organizationInitialState,
  };

  // electron app has additional state that we should init store with
  if (process.env.NEXT_PUBLIC_IS_ELECTRON && typeof window !== 'undefined') {
    preloadedState = merge(
      preloadedState,
      window.store.store,
    ) as StoreStateBlueprint;
    // Why "as StoreStateBlueprint"? TLDR: deepMerge isn't able to correctly infer that it'll still be StoreStateBlueprint after merging in Partial<> properties
    // See here: https://github.com/voodoocreation/ts-deepmerge?tab=readme-ov-file#when-working-with-generic-declared-typesinterfaces
    // and here: https://github.com/voodoocreation/ts-deepmerge/issues/30
  }

  // AdditionalState is used for component testing and Storybook
  if (Object.keys(additionalState).length > 0) {
    preloadedState = merge(
      preloadedState,
      additionalState,
    ) as StoreStateBlueprint;
  }

  return configureStore({
    reducer: {
      abTest: abTestReducer,
      app: appReducer,
      diff: diffReducer,
      feedback: feedbackReducer,
      user: userReducer,
      license: licenseReducer,
      payments: paymentsReducer,
      organization: organizationReducer,
      // @ts-expect-error: we need this fake reducer here to store electron state
      global: {},
    },
    preloadedState: preloadedState,
    // @ts-ignore
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          /**
           * Ignore these action types, diffs can become really large
           * and fail serialization
           */
          ignoredActions: ['diff/addDiff'],
          ignoredPaths: ['diff.diffs'],
        },
      }),
  });
};

const makeStore = (): ReturnType<typeof makeConfiguredStore> => {
  const store = makeConfiguredStore();
  if (typeof window !== 'undefined') {
    setupAxios(store.dispatch);
  }
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type State = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<State> = useSelector;
export const useAppStore = () => useStore<State>();
export const wrapper = createWrapper(makeStore);
