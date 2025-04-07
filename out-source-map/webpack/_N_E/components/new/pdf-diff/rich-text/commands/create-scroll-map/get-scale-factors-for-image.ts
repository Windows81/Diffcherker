import PDFiumImage from 'lib/pdfium/image';

export default function getScaleFactorsForImage(
  image: PDFiumImage,
  width: number,
  height: number,
) {
  return {
    containerToCanvasWidth: width / image.canvasWidth,
    containerToCanvasWidthClamped:
      Math.min(width, image.canvasWidth) / image.canvasWidth,
    containerToImageWidth: width / image.width,
    containerToImageWidthClamped:
      Math.min(width, image.canvasWidth) / image.width,
    containerToCanvasHeight: height / image.canvasHeight,
  };
}
