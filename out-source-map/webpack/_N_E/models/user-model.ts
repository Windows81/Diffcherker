import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import { type SavedDiff } from 'redux/modules/diff-module';
import { clearSession } from 'redux/modules/user-module';
import { type AppDispatch } from 'redux/store';
import { type AnonDiff } from 'types/anonDiff';
import { type User } from 'types/user';

export const signup = async ({
  user,
  secretKeys,
}: {
  user: { name?: string; email?: string; password?: string };
  secretKeys: AnonDiff[];
}): Promise<AxiosResponse<User>> => {
  return await axios.post(createApiUrl(`/auth/signup`), {
    ...user,
    secretKeys,
  });
};

export const login = async ({
  user,
  secretKeys,
}: {
  user: { email?: string; password?: string };
  secretKeys: AnonDiff[];
}): Promise<AxiosResponse<User>> => {
  return await axios.post(createApiUrl(`/auth/login`), { ...user, secretKeys });
};

export const logout = async (): Promise<AxiosResponse> => {
  return await axios.post(createApiUrl(`/auth/logout`));
};

export const deleteUser = async ({
  idOrEmail,
  password,
}: {
  idOrEmail: number | string;
  password?: string;
}): Promise<AxiosResponse<unknown>> => {
  return await axios.post(createApiUrl(`/users/${idOrEmail}/delete`), {
    password,
  });
};

export const getCurrentUser = async (
  cookies?: string,
): Promise<AxiosResponse<User>> => {
  const config = cookies ? { headers: { Cookie: cookies } } : undefined;
  return await axios.get(createApiUrl(`/auth/me`), config);
};

export const getCountry = async (): Promise<AxiosResponse> => {
  return await axios.get(createApiUrl(`/users/country`));
};

export const resetPassword = async (data: {
  email?: string;
}): Promise<AxiosResponse<{ code: string }>> => {
  return await axios.post(createApiUrl(`/auth/reset-password`), data);
};

export const confirmResetPassword = async ({
  code,
  password,
}: {
  code: string;
  password?: string;
}): Promise<AxiosResponse<User>> => {
  return await axios.post(createApiUrl(`/auth/reset-password/${code}`), {
    password,
  });
};

export const changeEmail = async (data: {
  email?: string;
  password?: string;
}): Promise<AxiosResponse<unknown>> => {
  return await axios.post(createApiUrl(`/auth/change-email`), data);
};

export const changeName = async (data: {
  name: string;
}): Promise<AxiosResponse<unknown>> => {
  return await axios.post(createApiUrl(`/auth/change-name`), data);
};

export const confirmChangeEmail = async (
  code: string,
): Promise<AxiosResponse<User>> => {
  return await axios.post(createApiUrl(`/auth/change-email/${code}`));
};

export const setTaxId = async (
  taxId: string,
): Promise<AxiosResponse<unknown>> => {
  return await axios.post(createApiUrl(`/auth/set-tax-id`), { taxId });
};

export const getDiffs = async (data: {
  id: number | string;
}): Promise<AxiosResponse<SavedDiff[]>> => {
  return await axios.get(createApiUrl(`/users/${data.id}/diffs`));
};

export const getUserFromPurchaseCode = async (
  purchaseCode: string,
): Promise<AxiosResponse> => {
  return await axios.get(
    createApiUrl(`/users/user-from-purchase-code/${purchaseCode}`),
  );
};

export const assignLicense = async (
  licenseKey: string,
): Promise<AxiosResponse> => {
  return await axios.post(createApiUrl(`/users/me/assign-license`), {
    key: licenseKey,
  });
};

export const getCliToken = async (): Promise<AxiosResponse> => {
  return await axios.post(createApiUrl(`/users/me/cli-tokens`));
};

const isDiffcheckerApiUrl = (url?: string): boolean =>
  [process.env.NEXT_PUBLIC_API_URL as string, '/'].some((base) =>
    url?.startsWith(base),
  );

export const setupAxios = (dispatch: AppDispatch): void => {
  axios.defaults.withCredentials = true;
  axios.interceptors.response.use(undefined, async (error) => {
    if (
      !isDiffcheckerApiUrl(error?.response?.config?.url) ||
      error?.response?.status !== 401
    ) {
      return await Promise.reject(error);
    }
    dispatch(clearSession());
    return await Promise.reject(error);
  });
};

export const getRecaptchaStatus = (): Promise<AxiosResponse> => {
  return axios.get(createApiUrl(`/auth/recaptcha-status`));
};
