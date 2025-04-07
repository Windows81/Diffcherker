import { UseWorkerCall } from 'lib/hooks/use-worker';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import { NormalizeDiffInput } from 'lib/workers/normalize-worker';
import { Diff } from 'types/diff';
import { DiffLevel } from 'types/normalize';
import { sortHeaderFooterDiffs } from './sort-header-footer';

export type FooterDiff = Partial<Diff> & {
  left: string;
  right: string;
  docxPageSection?: number;
  docxPageType?: string;
};

/**
 * The main idea behind this function is map and coalesce all potential Page Section and Page Type (even/odd)
 * between two documents. So if one document is missing a footer, but the otherone has one, it still computes
 * as if the footer on the other one is present (as in the footer.xml exists), but is defined as an empty string
 * @param normalizeWorker
 * @param diffLevel
 * @param leftPdfiumDocumentContent
 * @param rightPdfiumDocumentContent
 * @returns
 */
export default async function computeFooterDiffs(
  normalizeWorker: UseWorkerCall<NormalizeDiffInput, Diff>,
  diffLevel: DiffLevel,
  leftPdfiumDocumentContent: PDFiumDocumentContent,
  rightPdfiumDocumentContent: PDFiumDocumentContent,
): Promise<FooterDiff[]> {
  const footersBySectionType: {
    [key: string]: Mutable<FooterDiff>;
  } = {};

  leftPdfiumDocumentContent.docxFooters?.forEach((footer) => {
    //If even footers exist, but the documen doesn't have the evenOdd settings then don't include
    if (
      footer.type === 'even' &&
      !leftPdfiumDocumentContent.docxSettings?.evenAndOddHeaders
    ) {
      return;
    }

    const key = `${footer.section} - ${footer.type}`;
    footersBySectionType[key] ??= {
      left: '',
      right: '',
      docxPageSection: footer.section,
      docxPageType: footer.type,
      diffLevel,
    };
    footersBySectionType[key].left = footer.text;
  });

  rightPdfiumDocumentContent.docxFooters?.forEach((footer) => {
    //If even footers exist, but the documen doesn't have the evenOdd settings then don't include
    if (
      footer.type === 'even' &&
      !rightPdfiumDocumentContent.docxSettings?.evenAndOddHeaders
    ) {
      return;
    }

    const key = `${footer.section} - ${footer.type}`;
    footersBySectionType[key] ??= {
      left: '',
      right: '',
      docxPageSection: footer.section,
      docxPageType: footer.type,
      diffLevel,
    };
    footersBySectionType[key].right = footer.text;
  });

  const diffs: FooterDiff[] = [];
  let footers = Object.values(footersBySectionType);

  // Prevent empty footer diffs from showing
  footers = footers.filter(
    (footer) => !(footer.left === '' && footer.right === ''),
  );

  //Sort by Section # first then by type: First < Default < Even
  footers = sortHeaderFooterDiffs(footers);

  for (let i = 0; i < footers.length; i++) {
    const footer = footers[i];
    const { data } = await normalizeWorker(footer);
    if (data) {
      diffs.push({ ...footer, ...data });
    }
  }

  return diffs;
}
