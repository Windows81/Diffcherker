import type PDFiumLoadingTask from './loading-task';
import type { PDFiumLoadingTaskOptions } from './loading-task';
import type PDFiumWorker from './worker-wrapper';

const currentWorkers: Record<number, PDFiumWorker> = {};

const PDFium = {
  loadDocument: async (
    file: ArrayBuffer,
    options: PDFiumLoadingTaskOptions,
  ): Promise<PDFiumLoadingTask> => {
    const PDFiumWorker = (await import('./worker-wrapper')).default;
    const PDFiumLoadingTask = (await import('./loading-task')).default;
    const worker = new PDFiumWorker();
    const task = new PDFiumLoadingTask(worker, file, options);
    currentWorkers[worker.id] = worker;
    return task;
  },
  destroyAllDocuments: () =>
    Object.values(currentWorkers).forEach((worker) => {
      worker.destroy();
      delete currentWorkers[worker.id];
    }),
  destroyDocumentsExcept: (...idsToKeep: (number | undefined)[]) => {
    const workers = Object.values(currentWorkers);
    workers.forEach((worker) => {
      if (!idsToKeep.includes(worker.id)) {
        worker.destroy();
        delete currentWorkers[worker.id];
      }
    });
  },
};

export default PDFium;
