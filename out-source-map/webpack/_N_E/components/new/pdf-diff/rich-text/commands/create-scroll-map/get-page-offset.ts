import PDFiumImage from 'lib/pdfium/image';

export default function getPageOffset(
  pageNumber: number,
  images: PDFiumImage[],
  pageSpacing: number = 0,
) {
  let i = 0;
  let offset = 0;
  while (i < pageNumber) {
    offset += images[i].height;
    offset += pageSpacing;
    i++;
  }

  return offset;
}
