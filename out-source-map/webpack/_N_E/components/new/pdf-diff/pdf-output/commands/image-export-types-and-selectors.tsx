export enum ExportType {
  PDF = 'pdf',
  PNG = 'png',
}

export enum ExportProgressState {
  NotExporting = 'NOT_EXPORTING',
  Exporting = 'EXPORTING',
  ExportFailed = 'EXPORT_FAILED',
}

export interface ExportProgress {
  state: ExportProgressState;
  message: string | null;
}

export const IMAGE_PAGE_SELECTOR = 'image-page-for-export';
export const HIDE_DURING_EXPORT_SELECTOR = 'hide-during-export';
