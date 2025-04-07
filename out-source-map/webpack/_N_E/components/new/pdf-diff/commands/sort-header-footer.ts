import { FooterDiff } from './compute-footer-diffs';
import { HeaderDiff } from './compute-header-diffs';

export function sortHeaderFooterDiffs(
  diffs: Mutable<HeaderDiff>[] | Mutable<FooterDiff>[],
) {
  return [...diffs].sort((diff1, diff2) => {
    const sectionDifference =
      (diff1.docxPageSection ?? 0) - (diff2.docxPageSection ?? 0);

    if (sectionDifference > 0) {
      return sectionDifference;
    }

    if (diff2.docxPageType === diff1.docxPageType) {
      return 0;
    } else if (diff2.docxPageType === 'first') {
      return 1;
    } else if (
      diff2.docxPageType === 'default' &&
      diff1.docxPageType !== 'first'
    ) {
      return 1;
    } else {
      return -1;
    }
  });
}
