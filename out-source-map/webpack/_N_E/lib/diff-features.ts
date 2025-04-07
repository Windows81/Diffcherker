import { getItem, setItem } from './local-storage';

export enum DiffFeature {
  MERGE = 'merge',
  REALTIME = 'realTime',
  UNIFIED = 'unified',
  COLLAPSED = 'collapsed',
  SYNTAX_HIGHLIGHT = 'syntaxHighlight',
  EXPORT_TEXT_DIFF_PDF = 'exportPdf',
  EXPORT_TEXT_DIFF_XLSX = 'exportXlsx',
  EXPORT_RICH_TEXT_PDF = 'exportRichTextPdf',
  EXPORT_DOCUMENT_IMAGE_DIFF_PDF = 'exportDocumentImageDiffPdf',
  EXPORT_DOCUMENT_IMAGE_DIFF_PNG = 'exportDocumentImageDiffImage',
  EXPORT_IMAGE_DIFF_PNG = 'exportImageDiffImage',
  EXPLAIN = 'explain',
  EXCEL_SORT_ROWS = 'excelSortRows',
  EXCEL_SORT_COLUMNS = 'excelSortColumns',
  EXCEL_NORMALIZE_DATES_US = 'excelNormalizeDatesUS',
  EXCEL_NORMALIZE_DATES_EU = 'excelNormalizeDatesEU',
}

const diffFeatureMonthlyLimit: Record<DiffFeature, number> = {
  [DiffFeature.MERGE]: 10,
  [DiffFeature.REALTIME]: 5,
  [DiffFeature.UNIFIED]: 5,
  [DiffFeature.COLLAPSED]: 5,
  [DiffFeature.SYNTAX_HIGHLIGHT]: 5,
  [DiffFeature.EXPORT_TEXT_DIFF_PDF]: 5,
  [DiffFeature.EXPORT_TEXT_DIFF_XLSX]: 5,
  [DiffFeature.EXPORT_RICH_TEXT_PDF]: 5,
  [DiffFeature.EXPORT_DOCUMENT_IMAGE_DIFF_PDF]: 5,
  [DiffFeature.EXPORT_DOCUMENT_IMAGE_DIFF_PNG]: 5,
  [DiffFeature.EXPORT_IMAGE_DIFF_PNG]: 5,
  [DiffFeature.EXPLAIN]: 5,
  [DiffFeature.EXCEL_SORT_ROWS]: 5,
  [DiffFeature.EXCEL_SORT_COLUMNS]: 5,
  [DiffFeature.EXCEL_NORMALIZE_DATES_US]: 5,
  [DiffFeature.EXCEL_NORMALIZE_DATES_EU]: 5,
};

/**
 * Generates a namespace for a limited use free feature
 * for the DiffChecker app. Limits usage on a per month basis.
 */
const localStorageNameForFeature = (feature: DiffFeature) => {
  const date = new Date();
  const localStorageLocation = `${feature}Uses-${date.getMonth()}-${date.getFullYear()}`;
  return localStorageLocation;
};

/**
 * Increases the feature usage amount for a given month and feature name
 */
export const increaseFeatureUsage = (feature: DiffFeature) => {
  const localStorageLocation = localStorageNameForFeature(feature);
  const featureUses = getItem(localStorageLocation);
  let newFeatureUses = 1;
  if (featureUses) {
    newFeatureUses = parseInt(featureUses, 10) + 1;
  }
  setItem(localStorageLocation, newFeatureUses.toString());
};

/**
 * Checks if the user can use the feature for free.
 * Does not increase the usage count, only checks if the limit has been reached.
 * Does not take into account pro status.
 */
export const canUseFeature = (feature: DiffFeature) => {
  const featureUses = getItem(localStorageNameForFeature(feature));
  if (
    featureUses &&
    parseInt(featureUses, 10) > diffFeatureMonthlyLimit[feature]
  ) {
    return false;
  }
  return true;
};
