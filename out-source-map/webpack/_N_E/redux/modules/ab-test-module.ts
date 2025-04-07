// import { range } from 'lib/seeded-random';
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import Tracking from 'lib/tracking';
import { HYDRATE } from 'next-redux-wrapper';
import { type HydrateAction } from 'types/hydrateAction';

export const prefix = '_react_redux_ab_';

export const experiments: Record<string, Experiment> = {
  '2025-02-04-image-diff-output-type': {
    id: '2025-02-04-image-diff-output-type',
    variants: {
      fade: {
        name: 'fade',
      },
      slider: {
        name: 'slider',
      },
    },
  },
};

export interface Variant {
  name: string;
  weight?: number;
}
type Variants = Record<string, Variant>;

export type ExperimentKeys = keyof typeof experiments;

export interface Experiment {
  id: string;
  choose?: (variants: Variants, ip?: string) => string;
  variants: Variants;
}

type Experiments = Record<string, Experiment>;

export function getExperimentCookies(): Partial<Record<string, string>> {
  const cookies = Cookies.get();
  const currentExperiments: Partial<Record<string, string>> = {};
  for (const key in cookies) {
    if (key.indexOf(prefix) === 0) {
      const name = key.slice(prefix.length);
      if (name in experiments) {
        currentExperiments[name] = cookies[key];
      }
    }
  }
  return currentExperiments;
}

export function setExperimentCookies(
  experiments: Record<ExperimentKeys | string, string>,
): void {
  for (const experiment in experiments) {
    Cookies.set(prefix + experiment, experiments[experiment], {
      expires: 1000,
    });
  }
}

export function chooseRandomly(variants: Variants): string {
  const weighedVariants: Variant[] = [];
  for (const key in variants) {
    const variant = variants[key];
    const weight = variant.weight || 1;
    for (let i = 0; i < weight; i++) {
      weighedVariants.push(variant);
    }
  }
  return weighedVariants[Math.floor(Math.random() * weighedVariants.length)]
    .name;
}

function getRandomVariant(experiment: Experiment, ip?: string): string {
  const choose = experiment.choose || chooseRandomly;
  return choose(experiment.variants, ip);
}

/* function ipToInt(ip: string): number {
  return (
    ip.split('.').reduce(function (ipInt, octet) {
      return (ipInt << 8) + parseInt(octet, 10);
    }, 0) >>> 0
  );
}

function getVariantFromIp(variants: Variants, ip: string): string {
  const weighedVariants: Variant[] = [];
  for (const key in variants) {
    const variant = variants[key];
    const weight = variant.weight || 1;
    for (let i = 0; i < weight; i++) {
      weighedVariants.push(variant);
    }
  }
  const variantToChoose = range(ipToInt(ip), 0, weighedVariants.length - 1);
  return weighedVariants[variantToChoose].name;
} */

function generateRandomState(
  experiments: Experiments,
  ip?: string,
): Partial<Record<string, string>> {
  const initialState: Partial<Record<string, string>> = {};

  for (const name in experiments) {
    initialState[name] = getRandomVariant(experiments[name], ip);
  }
  return initialState;
}

export type ABTestState = Readonly<{
  experiments: Record<ExperimentKeys | string, string>;
  isHydrated: boolean;
}>;

export const initialState: ABTestState = {
  experiments: {},
  isHydrated: false,
};

export const abTestSlice = createSlice({
  name: 'abtest',
  initialState,
  reducers: {
    initializeExperimentVariants: (state) => {
      const initValues = getExperimentCookies() as Record<string, string>;

      const randomState = generateRandomState(experiments) as Record<
        string,
        string
      >;

      const abTestGroups: Record<string, string> = {};

      for (const key in randomState) {
        if (initValues.hasOwnProperty(key)) {
          state.experiments[key] = initValues[key];
        } else {
          state.experiments[key] = randomState[key];
        }
        abTestGroups[experiments[key].id] = state.experiments[key];
      }

      Tracking.setAbTestGroups(abTestGroups);
      setExperimentCookies(state.experiments);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      if (state.isHydrated) {
        return state;
      }

      return {
        ...state,
        ...action.payload.abTest,
        isHydrated: true,
      };
    });
  },
});

export const { initializeExperimentVariants } = abTestSlice.actions;

const abTestReducer = abTestSlice.reducer;
export default abTestReducer;
