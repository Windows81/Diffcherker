import { MSWordDiagnostics } from 'types/ms-word-diagnostics';

/**
 * Information for an error that originates from the Electron process.
 * This is used to serialize errors over IPC.
 */
export interface ElectronErrorInfo {
  message: string;
  name: string;
  stack: string | undefined;
  diagnostics?: MSWordDiagnostics;
}

/**
 * Error class for exceptions from the Electron process.
 * Includes standard error properties and optional diagnostic information.
 */
export class ElectronError extends Error {
  // Private constructor to ensure errors are only created through the fromJSON method.
  private constructor(
    message: string,
    name: string,
    stack: string | undefined,
    public diagnostics?: MSWordDiagnostics,
  ) {
    super(message);
    this.name = name;
    this.stack = stack;
    if (diagnostics) {
      this.diagnostics = diagnostics;
    }
  }

  /**
   * Creates an instance of ElectronError from a plain JSON object.
   * This is useful when receiving error details over IPC.
   *
   * @param data - A JSON object conforming to ElectronErrorInfo.
   * @returns A new instance of ElectronError.
   */
  public static fromJSON(data: ElectronErrorInfo): ElectronError {
    return new ElectronError(
      data.message,
      data.name,
      data.stack,
      data.diagnostics,
    );
  }
}
