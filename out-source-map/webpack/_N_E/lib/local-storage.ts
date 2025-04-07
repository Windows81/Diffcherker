export const setItem = (key: string, value: string): void => {
  // check if localStorage available -> try/catch error
  try {
    const localStorage = window.localStorage;
    localStorage.setItem(key, value);
  } catch (err: unknown) {
    console.log(err);
  }
  return;
};

export const getItem = (key: string): string | null => {
  // check if localStorage available -> try/catch error
  try {
    const localStorage = window.localStorage;
    return localStorage.getItem(key);
  } catch (err: unknown) {
    console.log(err);
    return null;
  }
};
