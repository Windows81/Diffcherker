import {
  DiffFeature,
  increaseFeatureUsage,
  canUseFeature,
} from 'lib/diff-features';
import {
  ExportType,
  ExportProgressState,
  ExportProgress,
  IMAGE_PAGE_SELECTOR,
  HIDE_DURING_EXPORT_SELECTOR,
} from './image-export-types-and-selectors';
import html2canvas from 'html2canvas-add-mix-blend-mode';
import saveAs from 'file-saver';
import Tracking from 'lib/tracking';
import { captureException } from 'lib/sentry';
import { DiffInputType } from 'types/diff-input-type';

// Scale factor for PDF exports so that they appear at a reasonable size at 100% zoom
const PDF_SCALE = 0.33;

export const handleExport = async (
  inputType: DiffInputType,
  exportType: ExportType,
  feature: DiffFeature,
  isPro: boolean,
  openDesktopModal: (feature: DiffFeature) => void,
  setExportProgress: (progress: ExportProgress) => void,
) => {
  if (!checkFeatureUsage(feature, isPro, openDesktopModal)) {
    return;
  }

  setExportProgress({
    state: ExportProgressState.Exporting,
    message: 'Preparing for Export...',
  });

  const exportFunction =
    exportType === ExportType.PDF ? exportPagesToPdf : exportPagesToPng;

  try {
    await exportFunction(setExportProgress);
    Tracking.trackEvent('Exported diff', {
      diffInputType: inputType,
      fileType: exportType,
    });
    setExportProgress({
      state: ExportProgressState.NotExporting,
      message: null,
    });
  } catch (error) {
    captureException(error);
    setExportProgress({
      state: ExportProgressState.ExportFailed,
      message: 'Export failed',
    });
  }
};

const checkFeatureUsage = (
  feature: DiffFeature,
  isPro: boolean,
  openDesktopModal: (feature: DiffFeature) => void,
): boolean => {
  if (isPro) {
    return true;
  }

  increaseFeatureUsage(feature);

  if (!canUseFeature(feature)) {
    openDesktopModal(feature);
    return false;
  }
  return true;
};

const exportPagesToPdf = async (
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  const pageElements = document.querySelectorAll(`.${IMAGE_PAGE_SELECTOR}`);
  const totalPages = pageElements.length;

  if (totalPages === 0) {
    return;
  }

  try {
    toggleElementVisibility('hidden');
    if (totalPages === 1) {
      await exportSinglePageToPdf(
        pageElements[0] as HTMLElement,
        setExportProgress,
      );
    } else {
      await exportMultiplePagesToPdf(pageElements, setExportProgress);
    }
  } finally {
    toggleElementVisibility('visible');
  }
};

const exportSinglePageToPdf = async (
  pageElement: HTMLElement,
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  const { PDFDocument } = await import('pdf-lib');

  setExportProgress({
    state: ExportProgressState.Exporting,
    message: 'Exporting PDF...',
  });
  const canvas = await html2canvas(pageElement, { backgroundColor: null });
  const pngDataUrl = canvas.toDataURL('image/png');

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngDataUrl);
  const { width, height } = pngImage.scale(PDF_SCALE);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'UntitledDiff.pdf');
};

const exportMultiplePagesToPdf = async (
  pageElements: NodeListOf<Element>,
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  const { PDFDocument } = await import('pdf-lib');

  const totalPages = pageElements.length;
  const pdfPages: Uint8Array[] = [];

  for (let i = 0; i < totalPages; i++) {
    setExportProgress({
      state: ExportProgressState.Exporting,
      message: `Processing page ${i + 1} of ${totalPages} to PDF...`,
    });
    const canvas = await html2canvas(pageElements[i] as HTMLElement, {
      backgroundColor: null,
    });
    const pngDataUrl = canvas.toDataURL('image/png');
    const pageDoc = await PDFDocument.create();
    const pngImage = await pageDoc.embedPng(pngDataUrl);
    const { width, height } = pngImage.scale(PDF_SCALE);
    const page = pageDoc.addPage([width, height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    const pageBytes = await pageDoc.save();
    pdfPages.push(pageBytes);
  }

  setExportProgress({
    state: ExportProgressState.Exporting,
    message: 'Finalizing PDF...',
  });
  const finalPdf = await PDFDocument.create();
  for (const pageBytes of pdfPages) {
    const pageDoc = await PDFDocument.load(pageBytes);
    const [copiedPage] = await finalPdf.copyPages(pageDoc, [0]);
    finalPdf.addPage(copiedPage);
  }
  const pdfBytes = await finalPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'UntitledDiff.pdf');
};

const exportPagesToPng = async (
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  const pageElements = document.querySelectorAll(`.${IMAGE_PAGE_SELECTOR}`);
  const totalPages = pageElements.length;

  if (totalPages === 0) {
    return;
  }

  try {
    toggleElementVisibility('hidden');
    if (totalPages === 1) {
      await exportSinglePageToPng(
        pageElements[0] as HTMLElement,
        setExportProgress,
      );
    } else {
      await exportMultiplePagesToPng(pageElements, setExportProgress);
    }
  } finally {
    toggleElementVisibility('visible');
  }
};

const exportSinglePageToPng = async (
  pageElement: HTMLElement,
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  setExportProgress({
    state: ExportProgressState.Exporting,
    message: 'Exporting PNG...',
  });
  const canvas = await html2canvas(pageElement, { backgroundColor: null });
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((result) => resolve(result!), 'image/png');
  });
  saveAs(blob, 'UntitledDiff.png');
};

const exportMultiplePagesToPng = async (
  pageElements: NodeListOf<Element>,
  setExportProgress: (progress: ExportProgress) => void,
): Promise<void> => {
  const JSZip = (await import('jszip')).default;

  const zip = new JSZip();
  const totalPages = pageElements.length;

  for (let i = 0; i < totalPages; i++) {
    setExportProgress({
      state: ExportProgressState.Exporting,
      message: `Processing page ${i + 1} of ${totalPages} to PNG...`,
    });
    const canvas = await html2canvas(pageElements[i] as HTMLElement, {
      backgroundColor: null,
    });
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((result) => resolve(result!), 'image/png');
    });
    zip.file(`UntitledDiff-page-${i + 1}.png`, blob);
  }

  setExportProgress({
    state: ExportProgressState.Exporting,
    message: 'Finalizing ZIP file...',
  });
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'UntitledDiff.zip');
};

const toggleElementVisibility = (visibility: 'hidden' | 'visible') => {
  document.querySelectorAll(`.${HIDE_DURING_EXPORT_SELECTOR}`).forEach((el) => {
    (el as HTMLElement).style.visibility = visibility;
  });
};
