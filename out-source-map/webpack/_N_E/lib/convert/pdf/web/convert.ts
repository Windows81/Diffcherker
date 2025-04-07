import { convertRouteRequest } from '../convert-to-pdf';
import { PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';

const convert = async (
  documentInfo: WordDocumentInfo,
): Promise<PdfConversionResult> => {
  const response = await convertRouteRequest('pdf', documentInfo, {
    responseType: 'arraybuffer',
  });
  const metadata = JSON.parse(response.headers['x-data-metadata']);
  return { data: response.data, medium: metadata.medium, documentInfo };
};

export default convert;
