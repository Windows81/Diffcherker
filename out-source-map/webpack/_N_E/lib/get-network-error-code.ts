import { type NetworkError } from 'types/network-error';

export const isNetworkError = (
  error: unknown,
): error is NetworkError & { code: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as NetworkError).status !== undefined
  );
};

export const isNetworkErrorWithCode = (
  error: unknown,
): error is NetworkError & { code: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as NetworkError).code !== undefined
  );
};

function getNetworkErrorCode(error: unknown): string;
function getNetworkErrorCode(
  error: unknown,
  options: { allowUndefined: boolean },
): string | undefined;

function getNetworkErrorCode(
  error: unknown,
  options?: { allowUndefined: boolean },
): string | undefined {
  if (isNetworkErrorWithCode(error)) {
    return error.code;
  }

  if (!options?.allowUndefined) {
    return 'UNKNOWN_ERROR'; // pretty much all places that require a string error code actually receives the code so we should never get here theoretically
  }
}

export default getNetworkErrorCode;
