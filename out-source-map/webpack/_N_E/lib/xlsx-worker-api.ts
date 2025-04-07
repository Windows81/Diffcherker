import {
  DiffWorkBookRequest,
  DiffWorkBookResponse,
  ExcelWorkerMessageType,
} from 'types/xlsx-worker-types';
import { WorkBook } from 'xlsx';
import { normalizeError } from './messages';

export class ExcelWorkerAPI {
  private static _idCount: number = 0;

  private readonly _id: number;
  private readonly _worker: Worker;
  private _callbacks: Record<
    number,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve: (value: any | PromiseLike<any>) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reject: (reason?: any) => void;
    }
  > = {};
  private _messageCount: number = 0;

  constructor() {
    this._id = ExcelWorkerAPI._idCount++;
    this._worker = new Worker(
      new URL('./workers/xlsx-worker', import.meta.url),
    );
    this._worker.onmessage = this._onMessage.bind(this);
  }

  get id(): number {
    return this._id;
  }

  private _onMessage(event: MessageEvent) {
    const { id, data, error } = event.data;

    if (typeof id !== 'number' || !this._callbacks[id]) {
      return;
    }

    if (error) {
      console.log(error);
      this._callbacks[id].reject(normalizeError(error));
    } else {
      this._callbacks[id].resolve(data);
    }

    delete this._callbacks[id];
  }

  private async _sendMessage<T = void>(
    type: ExcelWorkerMessageType,
    data?: unknown,
    transfer?: Transferable[],
  ) {
    const id = this._messageCount++;

    return new Promise<T>((resolve, reject) => {
      this._callbacks[id] = { resolve, reject };
      this._worker.postMessage({ id, type, data }, { transfer });
    });
  }

  async diffWorkBook({
    sides,
    sheetNames,
    headerLineNumbers,
    transformationType,
    settings,
  }: DiffWorkBookRequest): Promise<DiffWorkBookResponse> {
    const diffResponse = { diffResult: [] } as unknown as DiffWorkBookResponse;

    // We need to send messages differently for this function because we need to handle multiple messages
    // from the worker. We retrieve the diff row data and metadata in separate messages to handle memory issues
    return new Promise((resolve, reject) => {
      const id = this._messageCount++;

      this._worker.onmessage = (event: MessageEvent) => {
        const { type, data, error } = event.data;

        if (error) {
          reject(normalizeError(error));
        }

        if (type === ExcelWorkerMessageType.DIFF_ROW_DATA) {
          diffResponse.diffResult.push(data);
          return;
        }

        const { CSVs, stats } = data;
        diffResponse.CSVs = CSVs;
        diffResponse.stats = stats;
        resolve(diffResponse);
      };

      // Manually send the initial message to the worker
      this._worker.postMessage({
        id,
        type: ExcelWorkerMessageType.DIFF_WORKBOOK,
        data: {
          sides,
          sheetNames,
          headerLineNumbers,
          transformationType,
          settings,
        },
      });
    });
  }

  async loadWorkBook(file: ArrayBuffer, fileType?: string): Promise<WorkBook> {
    return this._sendMessage(
      ExcelWorkerMessageType.LOAD_WORKBOOK,
      {
        file,
        fileType,
      },
      [file],
    );
  }

  async processWorkBook(
    workBook: WorkBook,
    selectedSheet: string,
  ): Promise<string[][]> {
    return this._sendMessage(ExcelWorkerMessageType.PROCESS_WORKBOOK, {
      workBook,
      selectedSheet,
    });
  }

  async destroy(): Promise<void> {
    this._callbacks = {};
    this._worker.terminate();
  }
}

// Export singleton instance or factory function if needed
export const createExcelWorker = (): ExcelWorkerAPI => {
  return new ExcelWorkerAPI();
};
