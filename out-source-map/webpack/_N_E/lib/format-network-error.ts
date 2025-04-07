import { type NetworkError } from '../types/network-error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatNetworkError = (error: any): NetworkError => {
  let errorToReturn: NetworkError = {
    name: 'NetworkError',
    url: error.config?.url,
    message: error.message,
  };
  if (error.response) {
    errorToReturn = {
      ...errorToReturn,
      ...error.response?.data.error,
      apiMessage: error.response?.data?.error?.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
  }
  return errorToReturn;
};

export default formatNetworkError;
