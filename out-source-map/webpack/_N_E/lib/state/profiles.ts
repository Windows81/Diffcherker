import * as electron from './electron';
import { atom, useAtom } from 'jotai';
import {
  RedlineOutputSettingsObject,
  defaultRedlineOutputSettings,
} from 'components/new/redline-output/settings';
import {
  defaultExcelDiffOutputSettings,
  ExcelDiffOutputSettingsObject,
} from 'components/new/excel-diff/excel-output/types';
import { DiffInputType } from 'types/diff-input-type';
import { PdfDiffOutputTypes } from 'lib/output-types';

export interface OldProfile {
  name: string;
  isDefault: boolean;
  configurations: Settings[];
}

export interface Settings {
  type: string;
  settings: RedlineOutputSettingsObject | ExcelDiffOutputSettingsObject;
}

export interface Config {
  [diffInputType: string]: {
    [diffOutputType: string]: object;
  };
}

// Increase this value whenever changes are made to the profile schema.
const SCHEMA_VERSION = 1;

export interface Profile {
  version?: number;
  name: string;
  isDefault: boolean;
  configurations: Config;
}

const defaultProfile = {
  version: SCHEMA_VERSION,
  name: 'Default',
  isDefault: true,
  configurations: {
    [DiffInputType.PDF]: {
      [PdfDiffOutputTypes.Redline]: defaultRedlineOutputSettings,
    },
    [DiffInputType.EXCEL]: defaultExcelDiffOutputSettings,
  },
};

function migrateProfileV1(oldProfile: OldProfile): Profile {
  return {
    version: SCHEMA_VERSION,
    name: oldProfile.name,
    isDefault: oldProfile.isDefault,
    configurations: {
      [DiffInputType.PDF]: {
        [PdfDiffOutputTypes.Redline]: oldProfile.configurations[0]
          .settings as RedlineOutputSettingsObject,
      },
      [DiffInputType.EXCEL]: defaultExcelDiffOutputSettings,
    },
  };
}

const migrateProfile = (profile: OldProfile | Profile): Profile => {
  // TODO: Remove this once we have migrated all profiles from the first version
  if (Array.isArray(profile.configurations)) {
    return migrateProfileV1(profile as OldProfile);
  }

  if ((profile as Profile)?.version === SCHEMA_VERSION) {
    return profile as Profile;
  }

  const deepmerge = require('deepmerge');
  const updatedProfile = deepmerge(defaultProfile, profile as Profile);
  updatedProfile.version = SCHEMA_VERSION;
  return updatedProfile;
};

const getProfiles = () => {
  const profiles = electron.storeGet('profiles');
  if (!profiles) {
    return profiles;
  }
  return profiles.map(migrateProfile);
};

// Internal atom that syncs with the electron store
const profilesInternalAtom = atom(getProfiles() ?? [defaultProfile]);

profilesInternalAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('profiles', (v) => {
    setAtom(v as Profile[]);
  });
};

const profilesAtom = atom(
  (get) => get(profilesInternalAtom),
  (_get, set, profiles: Profile[]) => {
    set(profilesInternalAtom, profiles);
    electron.storeSet('profiles', profiles);
  },
);

export const useProfiles = () => useAtom(profilesAtom);
