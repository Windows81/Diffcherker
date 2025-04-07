import { UseWorkerCall } from 'lib/hooks/use-worker';
import { PDFiumDocumentContent } from 'lib/pdfium/document';
import { NormalizeDiffInput } from 'lib/workers/normalize-worker';
import { Diff } from 'types/diff';
import { DiffLevel } from 'types/normalize';

export default async function computeEndnotesDiff(
  normalizeWorker: UseWorkerCall<NormalizeDiffInput, Diff>,
  diffLevel: DiffLevel,
  leftPdfiumDocumentContent: PDFiumDocumentContent,
  rightPdfiumDocumentContent: PDFiumDocumentContent,
) {
  const leftEndnotesString = (leftPdfiumDocumentContent.docxEndnotes ?? [])
    .map((endnote) => endnote.text)
    .join('\n\n');
  const rightEndnotesString = (rightPdfiumDocumentContent.docxEndnotes ?? [])
    .map((endnote) => endnote.text)
    .join('\n\n');

  if (leftEndnotesString === '' && rightEndnotesString === '') {
    return undefined;
  }

  const { data } = await normalizeWorker({
    left: leftEndnotesString,
    right: rightEndnotesString,
    diffLevel: diffLevel,
  });

  return data;
}
