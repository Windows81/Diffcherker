import { Atom, PrimitiveAtom, WritableAtom, Getter, Setter, atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { AtomFamily } from 'jotai/vanilla/utils/atomFamily';
import stringify from 'fast-json-stable-stringify';

import { GitDiffWorkerPool } from './GitDiffWorkerPool';
import { GitDiffFileData, GitDiffMeta, GitDiffType } from './types';

import { gitDiffTextCreateAtom } from './diff-types/text/gitDiffTextCreateAtom';
import { gitDiffImageCreateAtom } from './diff-types/image/gitDiffImageCreateAtom';
import { gitDiffDocumentCreateAtom } from './diff-types/document/gitDiffDocumentCreateAtom';
import { gitDiffSpreadsheetCreateAtom } from './diff-types/spreadsheet/gitDiffSpreadsheetCreateAtom';

interface GitDiffFileAtomFamilyOptions {
  workerPoolAtom: Atom<GitDiffWorkerPool>;
  getFileDataAtom: Atom<(name: string) => Promise<GitDiffFileData>>;
}

interface RegisteredType<Settings, WorkerData, DiffData> {
  createSettingsAtom: () => PrimitiveAtom<Settings>;
  createWorkerDataAtom: (settings: Atom<Settings>) => Atom<WorkerData>;
  createDiffDataAtom: () => PrimitiveAtom<DiffData>;
}

type RegisteredTypes = {
  // TODO(@izaakschroeder): This is a totally ok use of `any` – somehow
  // the rules need to be relaxed to allow for it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in GitDiffType]: RegisteredType<any, any, any>;
};

const registeredTypes = {
  [GitDiffType.text]: gitDiffTextCreateAtom,
  [GitDiffType.image]: gitDiffImageCreateAtom,
  [GitDiffType.document]: gitDiffDocumentCreateAtom,
  [GitDiffType.spreadsheet]: gitDiffSpreadsheetCreateAtom,
} satisfies RegisteredTypes;

enum GitDiffActivityType {
  GitDiffLoadFile,
  GitDiffLoadMeta,
  GitDiffComputeDiff,
}

interface GitDiffActivity {
  type: GitDiffActivityType;
  // TODO(@izaakschroeder): Make this type better. Perhaps this
  // interface could be transformed into a generic and this could be
  // a `Promise<T>` instead?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promise: Promise<any>;
}

interface GitDiffActivityOptions {
  force?: boolean;
}

export type GitDiffDataAtom<T extends GitDiffType> = Atom<{
  settingsAtom: ReturnType<(typeof registeredTypes)[T]['createSettingsAtom']>;
  dataAtom: ReturnType<(typeof registeredTypes)[T]['createDiffDataAtom']>;
  computeDiffAtom: WritableAtom<
    null,
    [GitDiffActivityOptions] | [],
    Promise<unknown>
  >;
}>;

type GitDiffAtomFamily = <T extends GitDiffType>(type: T) => GitDiffDataAtom<T>;

/**
 * Creates a per-file settings atom that inherits defaults from some
 * global settings atom. Each file that can be diffed a specific way
 * gets an instance of this atom for that given diff type.
 */
const createSettingsAtom = <T>(globalSettingsAtom: Atom<T>) => {
  // These settings are specific to the current file being viewed and
  // are only set if the user overrides the global defaults.
  const localSettingsAtom = atom<T | null>(null);

  // A meta-atom that takes care of combining global and local settings
  // into a single atom.
  return atom(
    (get) => {
      return get(localSettingsAtom) ?? get(globalSettingsAtom);
    },
    (get, set, newSettings: ((old: T) => T) | T) => {
      if (typeof newSettings === 'function') {
        const old = get(localSettingsAtom) ?? get(globalSettingsAtom);
        return set(localSettingsAtom, (newSettings as (old: T) => T)(old));
      }
      set(localSettingsAtom, newSettings);
    },
  );
};

/**
 * Creates an atom that returns the diff data for the current diff
 * settings. The `dataAtomStorage` represents cached data storage for
 * the computed diff data keyed on the current value of `cacheKeyAtom`.
 */
// TODO(@izaakschroeder): This is a totally ok use of `any` – somehow
// the rules need to be relaxed to allow for it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDiffDataAtom = <Key, Data extends PrimitiveAtom<any>>(
  cacheKeyAtom: Atom<Key>,
  dataAtomStorage: AtomFamily<Key, Data>,
) => {
  return atom(
    (get) => {
      const key = get(cacheKeyAtom);
      const dataAtom = dataAtomStorage(key);
      return get(dataAtom);
    },
    (get, set, newData) => {
      const key = get(cacheKeyAtom);
      const dataAtom = dataAtomStorage(key);
      return set(dataAtom, newData);
    },
  );
};

/**
 * Creates an atom family for storing all data related to a file,
 * including its contents, its metadata and its diff data. This is the
 * primary source of truth for driving the DiffChecker™ GitDiff™ UI.
 */
export const gitDiffFileAtomFamily = (
  options: GitDiffFileAtomFamilyOptions,
) => {
  const { getFileDataAtom, workerPoolAtom } = options;

  // TODO(@izaakschroeder): Expose this atom in order to allow users to
  // edit global diff type settings.
  const globalSettingsAtomFamily = atomFamily((diffType: GitDiffType) => {
    const registeredType = registeredTypes[diffType];
    return registeredType.createSettingsAtom();
  });

  // This function creates an atom for each file that is loaded.
  // TODO(@izaakschroeder): `jotai` offers a way to flush entries here
  // and we could leverage this to soften the amount of memory we use
  // if needed.
  // See: https://jotai.org/docs/utilities/family#caveat-memory-leaks
  return atomFamily((name: string) => {
    const collapsedAtom = atom(false);
    const settingsOpenAtom = atom(false);
    const activityAtom = atom<GitDiffActivity[]>([]);
    const loadingAtom = atom((get) => get(activityAtom).length > 0);
    const errorsAtom = atom<Error[]>([]);
    const errorAtom = atom((get) => get(errorsAtom).length > 0);
    const diffTypeAtom = atom<GitDiffType | null>(null);
    const fileDataAtom = atom<GitDiffFileData | null>(null);
    const fileMetaAtom = atom<GitDiffMeta | null>(null);
    const pushActivityAtom = atom(
      null,
      (_get, set, activity: GitDiffActivity) => {
        set(activityAtom, (prev) => [...prev, activity]);
      },
    );
    const popActivityAtom = atom(
      null,
      (_get, set, activity: GitDiffActivity) => {
        set(activityAtom, (prev) => prev.filter((x) => x !== activity));
      },
    );
    const pushErrorAtom = atom(null, (_get, set, err: Error) => {
      set(errorsAtom, (prev) => [...prev, err]);
    });
    const popErrorAtom = atom(null, (_get, set, err: Error) => {
      set(errorsAtom, (prev) => prev.filter((x) => x !== err));
    });

    // NOTE: This is not an atom because of the generic <T> so we must
    // manually pass get/set.
    // An "activity" is any of the computational actions taken when
    // processing a file for diffing. I could not come up with a better
    // name. This function takes a "creator" that is called when the
    // activity is to be invoked, and otherwise ensures that only one
    // activity of a given type is running at a time.
    // TODO(@izaakschroeder): Should activities also be serialized?
    const startActivity = <T>(
      get: Getter,
      set: Setter,
      activityType: GitDiffActivityType,
      _options: GitDiffActivityOptions,
      target: PrimitiveAtom<T>,
      create: () => Promise<T>,
    ) => {
      if (get(target)) {
        return;
      }
      const activities = get(activityAtom);
      const existing = activities.find((v) => v.type === activityType);
      if (existing) {
        return existing.promise;
      }
      const promise = Promise.resolve()
        .then(() => create())
        .then(
          (result) => {
            set(target, result);
            return result;
          },
          (error) => {
            set(pushErrorAtom, error);
          },
        )
        .finally(() => {
          set(popActivityAtom, activity);
        });
      const activity = {
        type: activityType,
        promise,
      };
      set(pushActivityAtom, activity);

      return promise;
    };

    const loadFileDataAtom = atom(
      null,
      async (get, set, options: GitDiffActivityOptions = {}) => {
        // Call upstream to fetch the actual file data.
        return await startActivity(
          get,
          set,
          GitDiffActivityType.GitDiffLoadFile,
          options,
          fileDataAtom,
          () => get(getFileDataAtom)(name),
        );
      },
    );

    const loadFileMetaAtom = atom(
      null,
      async (get, set, options: GitDiffActivityOptions = {}) => {
        const fileData =
          get(fileDataAtom) ??
          ((await set(loadFileDataAtom, options)) as GitDiffFileData);

        // Kick off processing in the worker.
        return await startActivity(
          get,
          set,
          GitDiffActivityType.GitDiffLoadMeta,
          options,
          fileMetaAtom,
          () => {
            // If there is no file data we cannot get its meta
            if (!fileData) {
              throw new Error('Missing file data');
            }
            return get(workerPoolAtom)
              .gitDiffFileMeta(name, fileData)
              .then((result) => {
                const existingDiffType = get(diffTypeAtom);
                // Set the current diff type to be one of the allowed ones if
                // it currently is not. This includes the case where it's not
                // initially set.
                if (!result.allowed.includes(existingDiffType as GitDiffType)) {
                  set(diffTypeAtom, result.allowed[0]);
                }
                return result;
              });
          },
        );
      },
    );

    const createComputeDiffAtom = <TDiffData, TWorkerData>(
      diffDataAtom: WritableAtom<
        TDiffData,
        [TDiffData | ((prev: TDiffData) => TDiffData)],
        void
      >,
      workerDataAtom: Atom<TWorkerData>,
    ) => {
      return atom(
        null,
        async (get, set, options: GitDiffActivityOptions = {}) => {
          // Get the raw file data
          const fileData =
            get(fileDataAtom) ??
            ((await set(loadFileDataAtom, options)) as GitDiffFileData);
          // Get the file metadata
          const fileMeta =
            get(fileMetaAtom) ??
            ((await set(loadFileMetaAtom, options)) as GitDiffMeta);

          // Get currently selected diff type
          const diffType = get(diffTypeAtom);

          // Kick off processing in the worker.
          const workerData = get(workerDataAtom);
          return await startActivity(
            get,
            set,
            GitDiffActivityType.GitDiffComputeDiff,
            options,
            diffDataAtom,
            () => {
              // Perform sanity check.
              if (!fileData) {
                throw new Error('Missing file data');
              }
              if (!fileMeta) {
                throw new Error('Missing file meta');
              }
              if (!diffType) {
                throw new Error('Missing diff type');
              }

              if (!fileMeta.allowed.includes(diffType)) {
                throw new Error('Invalid diff type');
              }

              // TODO(@izaakschroeder): Handle transfer of `fileData`
              // properly. This probably means calling `set(fileData)`
              // on a new array being returned.
              // See: https://stackoverflow.com/questions/20738845/
              return get(workerPoolAtom).gitDiff(
                name,
                diffType,
                fileData,
                fileMeta,
                workerData,
              ) as Promise<TDiffData>;
            },
          );
        },
      );
    };

    const diffAtomFamily = atomFamily((diffType: GitDiffType) => {
      const registeredType = registeredTypes[diffType];
      const globalSettingsAtom = globalSettingsAtomFamily(diffType);

      const settingsAtom = createSettingsAtom(
        // TODO(@izaakschroeder): Fix the typing here
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        globalSettingsAtom as any,
      );

      // Data to send to the worker based on the current settings.
      const workerDataAtom = registeredType.createWorkerDataAtom(
        // TODO(@izaakschroeder): Fix the typing here
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settingsAtom as any,
      );

      // Diff results based on worker data. If worker data changes then
      // we probably need to recompute the diff.
      // TODO(@izaakschroeder): We probably want to occasionally flush
      // stale data so that we don't balloon memory when user is
      // adjusting all their diff settings.
      // See: https://jotai.org/docs/utilities/family#caveat-memory-leaks
      // TODO(@izaakschroeder): We should probably define the equality
      // operator here so make sure `workerDataAtom` is somehow
      // memoized to return objects with reference equality. The fix
      // could be as simple as `JSON.stringify` the worker data. See
      // also the implementation of `createDiffDataAtom`.
      const diffDataAtomFamily = atomFamily(() => {
        return registeredType.createDiffDataAtom();
      });

      const cacheKeyAtom = atom((get) => {
        return stringify(get(workerDataAtom));
      });
      const dataAtom = createDiffDataAtom(cacheKeyAtom, diffDataAtomFamily);
      const computeDiffAtom = createComputeDiffAtom(dataAtom, workerDataAtom);

      return atom({
        /**
         * Write-only atom that allows the consumer to request the diff
         * be computed.
         */
        computeDiffAtom,

        /**
         * Diff data based on the current settings.
         */
        dataAtom,

        /**
         * Current settings for the currently selected diff type. Note
         * these settings inherit from a global settings atom of the
         * given diff type as well.
         */
        settingsAtom,
      });
    });

    // Generate the atom associated with a given file.
    // See: https://jotai.org/docs/guides/atoms-in-atom
    return atom({
      // ==============================================================
      // Read-only atoms
      // ==============================================================

      /**
       * True if some data related to the file is currently loading.
       */
      loadingAtom,

      /**
       * True if there is an error related to the current file.
       */
      errorAtom,

      /**
       * A list of all the errors associated with the current file.
       */
      errorsAtom,

      /**
       * Data associated with the computation using the given diff
       * engine. This can include the diff data as well as related
       * UI state.
       */
      diffAtomFamily: diffAtomFamily as GitDiffAtomFamily,

      // ==============================================================
      // Write-only atoms
      // ==============================================================

      /**
       * Remove an error from the list of errors. This is used when the
       * user wishes to acknowledge an error or errors.
       */
      popErrorAtom,

      /**
       * Load the raw file data for the given file.
       */
      loadFileDataAtom,

      /**
       * Load the metadata for the given file.
       */
      loadFileMetaAtom,

      // ==============================================================
      // Read-write atoms
      // ==============================================================

      /**
       * True if the settings for the current diff type for this file
       * are opened in the UI.
       */
      settingsOpenAtom,

      /**
       * True if the file is collapsed in the UI.
       */
      collapsedAtom,

      /**
       * The currently active diff engine for this file.
       */
      diffTypeAtom,

      /**
       * Raw left/right data associated with the file.
       * NOTE: This data is transferred to an engine worker when
       * processing and will be unavailable during that time.
       * Re-diffing a SINGLE file thus cannot be done in parallel.
       */
      fileDataAtom,

      /**
       * Metadata associated with the individual sides as well as the
       * overall diff.
       */
      fileMetaAtom,
    });
  });
};

export type ExtractFamily<T> =
  T extends AtomFamily<string, infer U> ? U : never;
export type GitDiffFileAtomFamily = ReturnType<typeof gitDiffFileAtomFamily>;
export type GitDiffFileAtom = ExtractFamily<GitDiffFileAtomFamily>;
