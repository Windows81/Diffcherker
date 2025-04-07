import { Diff } from 'types/diff';

const getDiffTitle = (diff?: Diff): string => {
  if (diff?.title) {
    return diff.title;
  }

  // Previously we showed this when there was no title, not sure if we want to keep it
  // if (diff?.slug) {
  //   return `Saved diff ${diff.slug}`;
  // }

  return 'Untitled diff';
};

export default getDiffTitle;
