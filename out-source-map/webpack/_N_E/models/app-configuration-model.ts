import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import { Features } from 'types/features';

export const fetchFeatures = async (): Promise<AxiosResponse<Features>> => {
  return await axios.get(createApiUrl(`/app/features`));
};

export const updateFeatures = async (
  features: Features,
): Promise<AxiosResponse<Features>> => {
  return await axios.patch(createApiUrl(`/app/features`), features);
};
