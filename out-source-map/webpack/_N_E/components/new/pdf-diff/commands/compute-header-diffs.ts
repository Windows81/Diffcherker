import { UseWorkerCall } from 'lib/hooks/use-worker';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import { NormalizeDiffInput } from 'lib/workers/normalize-worker';
import { Diff } from 'types/diff';
import { DiffLevel } from 'types/normalize';
import { sortHeaderFooterDiffs } from './sort-header-footer';

export type HeaderDiff = Partial<Diff> & {
  left: string;
  right: string;
  docxPageSection?: number;
  docxPageType?: string;
};

/**
 * The main idea behind this function is map and coalesce all potential Page Section and Page Type (even/odd/first)
 * between two documents. So if one document is missing a header, but the otherone has one, it still computes
 * as if the header on the other one is present (as in the header.xml exists), but is defined as an empty string
 * @param normalizeWorker
 * @param diffLevel
 * @param leftPdfiumDocumentContent
 * @param rightPdfiumDocumentContent
 * @returns
 */
export default async function computeHeaderDiffs(
  normalizeWorker: UseWorkerCall<NormalizeDiffInput, Diff>,
  diffLevel: DiffLevel,
  leftPdfiumDocumentContent: PDFiumDocumentContent,
  rightPdfiumDocumentContent: PDFiumDocumentContent,
): Promise<HeaderDiff[]> {
  const headersBySectionType: {
    [key: string]: Mutable<HeaderDiff>;
  } = {};

  leftPdfiumDocumentContent.docxHeaders?.forEach((header) => {
    //If even headers exist, but the documen doesn't have the evenOdd settings then don't include
    if (
      header.type === 'even' &&
      !leftPdfiumDocumentContent.docxSettings?.evenAndOddHeaders
    ) {
      return;
    }

    const key = `${header.section} - ${header.type}`;
    headersBySectionType[key] ??= {
      left: '',
      right: '',
      docxPageSection: header.section,
      docxPageType: header.type,
      diffLevel,
    };
    headersBySectionType[key].left = header.text;
  });

  rightPdfiumDocumentContent.docxHeaders?.forEach((header) => {
    //If even headers exist, but the documen doesn't have the evenOdd settings then don't include
    if (
      header.type === 'even' &&
      !rightPdfiumDocumentContent.docxSettings?.evenAndOddHeaders
    ) {
      return;
    }

    const key = `${header.section} - ${header.type}`;
    headersBySectionType[key] ??= {
      left: '',
      right: '',
      docxPageSection: header.section,
      docxPageType: header.type,
      diffLevel,
    };
    headersBySectionType[key].right = header.text;
  });

  const diffs: HeaderDiff[] = [];
  let headers = Object.values(headersBySectionType);

  // Prevent empty header diffs from showing
  headers = headers.filter(
    (header) => !(header.left === '' && header.right === ''),
  );

  //Sort by Section # first then by type: First < Default < Even
  headers = sortHeaderFooterDiffs(headers);

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const { data } = await normalizeWorker(header);
    if (data) {
      diffs.push({ ...header, ...data });
    }
  }

  return diffs;
}
