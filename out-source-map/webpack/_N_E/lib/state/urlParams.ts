// TODO(@izaakschroeder): Fix this.
// We should just be using `next/router` but it has a query of `{}`
// even though `window.location.href` is correct?
export const useUrlParams = (): Record<string, string | undefined> => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    return Object.fromEntries(url.searchParams.entries());
  }
  return {};
};
