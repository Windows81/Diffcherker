export class IntersectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntersectionError';
  }
}

/**
 * The raw text from the docx file contains paragraph information. The raw text
 * from the pdf file contains page range information. This function intersects
 * the two to create a single string that contains both paragraph and page range
 * information.
 */
const intersectDocxPdfText = (rawDocxText: string, pdfText: string): string => {
  const normalizeText = (text: string) =>
    text
      .normalize('NFC') // Unicode normalization
      .replace(/[\u0300-\u036f]/g, '') // Remove all mark characters, including accents
      .replace(/[^\p{L}\p{N}]/gu, '') // Keep only letters and numbers from any language
      .replace(/[\uD835][\uDC00-\uDFFF]/g, '') // Remove mathematical alphanumeric symbols
      .toLowerCase();

  // Normalize text
  const normalizedDocxText = normalizeText(rawDocxText);
  const normalizedPdfText = normalizeText(pdfText);
  const rawParagraphs = rawDocxText.split('\n');
  const normalizedRawParagraphs = rawParagraphs.map(normalizeText);

  // Find bounding indices
  const docxStartIdx = normalizedDocxText.indexOf(normalizedPdfText);
  const docxEndIdx = docxStartIdx + normalizedPdfText.length;
  if (docxStartIdx === -1) {
    throw new IntersectionError('No matching text found.');
  } else if (docxEndIdx > normalizedDocxText.length) {
    throw new IntersectionError('Invalid bounding indices.');
  }

  const paragraphs: string[] = [];
  let curTextIdx = 0;

  const handleCutOffParagraph = (paragraphIdx: number) => {
    const isFirstParagraphCutOff =
      paragraphs.length === 0 && curTextIdx !== docxStartIdx;
    const isLastParagraphCutOff =
      curTextIdx + normalizedRawParagraphs[paragraphIdx].length > docxEndIdx;

    const rawParagraph = rawParagraphs[paragraphIdx];
    if (isFirstParagraphCutOff) {
      for (let i = 0; i < rawParagraph.length; i++) {
        const normalizedSubstring = normalizeText(rawParagraph.substring(i));
        if (normalizedPdfText.startsWith(normalizedSubstring)) {
          return rawParagraph.substring(i).trimStart();
        }
      }
      throw new IntersectionError('Unable to resolve first paragraph cut off.');
    } else if (isLastParagraphCutOff) {
      for (let i = 0; i < rawParagraph.length; i++) {
        const normalizedSubstring = normalizeText(
          rawParagraph.substring(0, rawParagraph.length - i),
        );
        if (normalizedPdfText.endsWith(normalizedSubstring)) {
          return rawParagraph.substring(0, rawParagraph.length - i).trimEnd();
        }
      }
      throw new IntersectionError('Unable to resolve last paragraph cut off.');
    } else {
      return rawParagraph;
    }
  };

  // Add paragraphs that are within the page range
  normalizedRawParagraphs.forEach((paragraph, idx) => {
    const isAfterStart = curTextIdx + paragraph.length > docxStartIdx;
    const isBeforeEnd = curTextIdx < docxEndIdx;

    if (!isAfterStart || !isBeforeEnd) {
      curTextIdx += paragraph.length;
      return;
    }

    paragraphs.push(handleCutOffParagraph(idx));
    curTextIdx += paragraph.length;
  });

  return paragraphs.join('\n');
};

export default intersectDocxPdfText;
