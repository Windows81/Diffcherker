import { ExcelWorkerAPI } from 'lib/xlsx-worker-api';
import type { ExcelLoadingTaskOptions } from './loading-task';
import type ExcelLoadingTask from './loading-task';
import type {
  DiffWorkBookRequest,
  DiffWorkBookResponse,
} from 'types/xlsx-worker-types';

const currentWorkers: Record<number, ExcelLoadingTask> = {};

const Excel = {
  handleNewWorkBook: async (
    file: ArrayBuffer,
    options: ExcelLoadingTaskOptions,
  ): Promise<ExcelLoadingTask> => {
    const ExcelWorker = new ExcelWorkerAPI();
    const ExcelLoadingTask = (await import('./loading-task')).default;
    const task = new ExcelLoadingTask(ExcelWorker, file, options);
    currentWorkers[ExcelWorker.id] = task;
    return task;
  },
  generateDiff: async (
    data: DiffWorkBookRequest,
  ): Promise<DiffWorkBookResponse> => {
    const ExcelWorker = new ExcelWorkerAPI();
    const response = await ExcelWorker.diffWorkBook(data);
    ExcelWorker.destroy();
    return response;
  },
  destroyAllSpreadsheets: () => {
    const workers = Object.values(currentWorkers);
    workers.forEach((worker) => {
      worker.destroy();
    });
  },
  destroySpreadsheetsExcept: (...idsToKeep: (number | undefined)[]) => {
    const workers = Object.values(currentWorkers);
    workers.forEach((worker) => {
      if (!idsToKeep.includes(worker.id)) {
        worker.destroy();
      }
    });
  },
};

export default Excel;
