import { UseWorkerCall } from 'lib/hooks/use-worker';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import { NormalizeDiffInput } from 'lib/workers/normalize-worker';
import { Diff } from 'types/diff';
import { DiffLevel } from 'types/normalize';

export default async function computeFootnotesDiff(
  normalizeWorker: UseWorkerCall<NormalizeDiffInput, Diff>,
  diffLevel: DiffLevel,
  leftPdfiumDocumentContent: PDFiumDocumentContent,
  rightPdfiumDocumentContent: PDFiumDocumentContent,
) {
  const leftFootnotesString = (leftPdfiumDocumentContent.docxFootnotes ?? [])
    .map((footnote) => footnote.text)
    .join('\n\n');
  const rightFootnotesString = (rightPdfiumDocumentContent.docxFootnotes ?? [])
    .map((footnote) => footnote.text)
    .join('\n\n');

  if (leftFootnotesString === '' && rightFootnotesString === '') {
    return undefined;
  }

  const { data } = await normalizeWorker({
    left: leftFootnotesString,
    right: rightFootnotesString,
    diffLevel: diffLevel,
  });

  return data;
}
