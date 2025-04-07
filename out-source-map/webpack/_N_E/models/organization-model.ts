import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import { type Organization, type SamlConfiguration } from 'types/organization';

export const getMine = async (): Promise<AxiosResponse<Organization>> =>
  await axios.get(createApiUrl('/organizations/mine'));

export const setSamlConfiguration = async (
  config: SamlConfiguration,
): Promise<AxiosResponse<Organization>> =>
  await axios.put(createApiUrl('/organizations/mine/saml'), config);

export const clearSamlConfiguration = async (): Promise<AxiosResponse<void>> =>
  await axios.put(createApiUrl('/organizations/mine/saml'), {
    samlCertificate: '',
    samlIssuer: '',
    samlEntryPoint: '',
  });

export const getIdByEmail = async (email: string): Promise<AxiosResponse> => {
  return await axios.get(createApiUrl(`/organizations/ids/${email}`));
};
