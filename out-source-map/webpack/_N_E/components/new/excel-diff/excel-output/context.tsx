import {
  FC,
  ForwardedRef,
  createContext,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ExcelTransformationType,
  excelTransformationTypeToDiffFeatureMap,
} from './excel-transformations';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import { useDesktopModal } from '../../desktop-modal/context';
import {
  canUseFeature,
  DiffFeature,
  increaseFeatureUsage,
} from 'lib/diff-features';

export type ExcelDiffOutputApi = {
  applyTransformation: (
    transformationType: ExcelTransformationType,
  ) => Promise<void>;
  checkFeatureUsage: (feature: DiffFeature) => boolean;
};

interface ExcelDiffOutputContextInterface {
  api: ExcelDiffOutputApi;
}

export const nullApi: ExcelDiffOutputApi = {
  applyTransformation: async (_transformationType: ExcelTransformationType) => {
    /* noop */
  },
  checkFeatureUsage: () => false,
};

const ExcelDiffOutputContext = createContext<ExcelDiffOutputContextInterface>({
  api: nullApi,
});

type ExcelDiffOutputProviderProps = {
  apiRef?: ForwardedRef<ExcelDiffOutputApi>;
  findDifference: () => Promise<void>;
  setSelectedTransformation: (type: ExcelTransformationType) => void;
};

export const ExcelDiffOutputProvider: FC<
  React.PropsWithChildren<ExcelDiffOutputProviderProps>
> = ({ apiRef, children, findDifference, setSelectedTransformation }) => {
  const api = useRef<ExcelDiffOutputApi>(nullApi);
  const [currentApi, setCurrentApi] = useState<ExcelDiffOutputApi>(nullApi);
  const isPro = useAppSelector(isProUser);
  const { openDesktopModal } = useDesktopModal();

  /**
   * Checks if the user can use the feature.
   *
   * Pro status is checked in the store
   * We need to check if they are pro before checking free usage via local storage,
   * since pro users can use features without any limitations.
   */
  const checkFeatureUsage = useCallback(
    (feature: DiffFeature) => {
      if (isPro) {
        return true;
      }

      increaseFeatureUsage(feature);

      if (!canUseFeature(feature)) {
        openDesktopModal(feature);
        return false;
      }
      return true;
    },
    [isPro, openDesktopModal],
  );

  const findDifferenceRef = useRef(findDifference);
  useEffect(() => {
    findDifferenceRef.current = findDifference;
  }, [findDifference]);

  /**
   * Meant to keep the internal ref's api up to date with the state variables
   * inside the componennt.
   */
  useEffect(() => {
    api.current = {
      applyTransformation: async (type: ExcelTransformationType) => {
        const diffFeature = excelTransformationTypeToDiffFeatureMap[type];
        if (diffFeature && checkFeatureUsage(diffFeature) === false) {
          return;
        }
        setSelectedTransformation(type);

        // Use the ref instead of the direct function
        await findDifferenceRef.current();
      },
      checkFeatureUsage,
    };

    setCurrentApi(api.current);
  }, [setSelectedTransformation, checkFeatureUsage, canUseFeature]);

  useImperativeHandle(apiRef, () => currentApi, [currentApi]);

  return (
    <ExcelDiffOutputContext.Provider
      value={{
        api: currentApi,
      }}
    >
      {children}
    </ExcelDiffOutputContext.Provider>
  );
};

export default ExcelDiffOutputContext;
