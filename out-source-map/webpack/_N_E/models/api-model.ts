import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';

export const checkStatus = async (): Promise<AxiosResponse> => {
  return await axios.get(createApiUrl(`/`));
};
