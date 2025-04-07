// We use this module when routing to diffs instead of Next.js router b/c we have to persist index state in history.
// If we don't, history navigation bugs will occur (e.g. back/forward buttons are buggy).
// Ideally we would just want to use the Next.js router for everything, but the current dynamic routing structure doesn't allow for that.
// If we ever move to handling dynamic routes the Next.js way, we can delete this module.
// https://nextjs.org/docs/routing/dynamic-routes

// Unfortunately by manipulating history manually, we create bugs with the back/forward button when naving between different pages that use the Next.js router.
// e.g. Create new diff -> nav to Image diff page
// Again, these bugs will be fixed if we ever move to handling dynamic routes the Next.js way.

const push = (
  url: string,
  asPath: string,
  name: string,
  index: number,
  locale: string,
): void => {
  window.history.pushState(
    {
      url,
      as: asPath,
      idx: index,
      options: {
        index,
        locale,
        _shouldResolveHref: true,
      },
      __N: true,
    },
    name,
    (locale === 'en' ? '' : '/' + locale) + asPath,
  );
};

const replace = (
  url: string,
  asPath: string,
  name: string,
  index: number,
  locale: string,
): void => {
  window.history.replaceState(
    {
      url,
      as: asPath,
      idx: index,
      options: {
        index,
        locale,
      },
    },
    name,
    (locale === 'en' ? '' : '/' + locale) + asPath,
  );
};

const defaultExport = { push, replace };
export default defaultExport;
