import { ExcelWorkerAPI } from 'lib/xlsx-worker-api';
import { WorkBook } from 'xlsx';

export type ExcelLoadingTaskOptions = {
  fileType?: string;
  onLoad: (workBook: WorkBook, id: number) => void;
  onError: (error: Error) => void;
};

export class ExcelLoadingTask {
  private readonly _worker: ExcelWorkerAPI;
  private workBook: WorkBook | null = null;

  onLoad: (workBook: WorkBook, id: number) => void;
  onError: (error: Error) => void;

  constructor(
    worker: ExcelWorkerAPI,
    file: ArrayBuffer,
    options: ExcelLoadingTaskOptions,
  ) {
    this._worker = worker;
    this.onLoad = options.onLoad;
    this.onError = options.onError;

    this._loadWorkBook(file, options.fileType)
      .then((wb) => {
        this.workBook = wb;
        this.onLoad(wb, this._worker.id);
      })
      .catch((error) => {
        this.workBook = null;
        this.onError(error);
      });
  }

  get id(): number {
    return this._worker.id;
  }

  async _loadWorkBook(file: ArrayBuffer, fileType?: string): Promise<WorkBook> {
    const workbook = await this._worker.loadWorkBook(file, fileType);
    if (workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in workbook');
    }
    return workbook;
  }

  async processWorkBook(
    workBook?: WorkBook,
    selectedSheet?: string,
  ): Promise<string[][]> {
    if (!workBook || !selectedSheet) {
      return [];
    }
    return await this._worker.processWorkBook(workBook, selectedSheet);
  }

  async destroy(): Promise<void> {
    if (this.workBook) {
      if (this.workBook.Custprops) {
        this.workBook.Custprops = {};
      }
      this.workBook.SheetNames = [];
      this.workBook.Sheets = {};
      this.workBook = null;
    }

    await new Promise<void>((resolve) => {
      const checkTerminated = () => {
        if (!this._worker) {
          resolve();
        } else {
          setTimeout(checkTerminated, 10);
        }
      };
      this._worker.destroy();
      checkTerminated();
    });
  }
}

export default ExcelLoadingTask;
