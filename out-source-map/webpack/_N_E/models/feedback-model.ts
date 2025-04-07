import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';

export const create = async (
  data: Record<string, unknown>,
): Promise<AxiosResponse> => {
  return await axios.post(createApiUrl(`/feedback`), data);
};
