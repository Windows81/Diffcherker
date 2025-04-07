import PDFiumImage from './pdfium/image';

export enum PdfPageSide {
  Both = 'both',
  Left = 'left',
  Right = 'right',
}

export interface PdfImageDiffResult {
  resultKey: string;
  mismatchPercentage: number;
  imageDataUrl: string;
  leftImageData?: string;
  rightImageData?: string;
  originalWidth?: number;
  originalHeight?: number;
  pageSide: PdfPageSide;
}

const getMinimumImageData = async (left: ImageData, right: ImageData) => {
  return {
    originalWidth: Math.min(left.width, right.width),
    originalHeight: Math.min(left.height, right.height),
  };
};

const getImageDataFromCanvas = (canvas?: HTMLCanvasElement) => {
  const context = canvas?.getContext('2d', { alpha: false });
  if (canvas && context) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
  }
};

const comparePdfImages = async (
  leftImages: PDFiumImage[],
  rightImages: PDFiumImage[],
): Promise<PdfImageDiffResult[]> => {
  const pdfImgDiffResultPromises: Array<Promise<PdfImageDiffResult>> = [];
  for (let i = 0; i < Math.max(leftImages.length, rightImages.length); i++) {
    const resultKey = `${Date.now()}${Math.random().toString(36).substring(2)}`;
    const compareImages = (await import('resemblejs/compareImages')).default;

    const leftImageCanvas = await leftImages[i]?.toCanvas();
    const rightImageCanvas = await rightImages[i]?.toCanvas();
    const leftImageData = getImageDataFromCanvas(leftImageCanvas);
    const rightImageData = getImageDataFromCanvas(rightImageCanvas);

    if (leftImageData && rightImageData) {
      const minImageData = await getMinimumImageData(
        leftImageData,
        rightImageData,
      );
      pdfImgDiffResultPromises.push(
        compareImages(
          leftImageData,
          rightImageData,
          {}, // see resemblejs options for example
        ).then((diffImageData) => ({
          resultKey,
          mismatchPercentage: Number(diffImageData.misMatchPercentage),
          imageDataUrl: diffImageData.getImageDataUrl(),
          leftImageData: leftImageCanvas.toDataURL('image/png'),
          rightImageData: rightImageCanvas.toDataURL('image/png'),
          originalWidth: minImageData.originalWidth,
          originalHeight: minImageData.originalHeight,
          pageSide: PdfPageSide.Both,
        })),
      );
      continue;
    }

    if (i < leftImages.length) {
      pdfImgDiffResultPromises.push(
        Promise.resolve({
          resultKey,
          mismatchPercentage: 100,
          imageDataUrl: leftImageCanvas.toDataURL('image/png'),
          pageSide: PdfPageSide.Left,
        }),
      );
      continue;
    }

    pdfImgDiffResultPromises.push(
      Promise.resolve({
        resultKey,
        mismatchPercentage: 100,
        imageDataUrl: rightImageCanvas.toDataURL('image/png'),
        pageSide: PdfPageSide.Right,
      }),
    );
  }

  return await Promise.all(pdfImgDiffResultPromises);
};

export default comparePdfImages;
