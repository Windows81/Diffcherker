import { PageRange } from 'types/page-range';
import {
  InvalidPDFException,
  MemoryException,
  PasswordException,
  UnknownException,
  UnknownMessageException,
} from './exceptions';
import {
  FPDF,
  FPDFError,
  FPDFFormType,
  FPDFRenderFlag,
  PDFiumMetadataTag,
  getFPDF,
} from './fpdf';
import {
  BoundingBox,
  PDFiumChunk,
  PDFiumDocumentContentResponse,
  PDFiumDocumentResponse,
  PDFiumImageData,
  PDFiumImageResponse,
  PDFiumMetadataResponse,
  PDFiumWorkerMessageType,
  PDFiumWorkerResponse,
} from './messages';
import {
  RichTextDiffType,
  RichTextDrawingChunk,
  RichTextExportType,
} from 'types/rich-text';
import { ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY } from '../s3-credentials';

const IMAGE_DATA_SCALE = 2; // this handles changing the image data size for display which is helpful for retina screens
const THUMBNAIL_MAX_WIDTH = 280;
const THUMBNAIL_MAX_HEIGHT = 206;

const SAME_PARAGRAPH_CHAR_HEIGHT_MULTIPLIER = 1.75;
const LETTER_PAPER_WIDTH = 612;
const LETTER_PAPER_HEIGHT = 792;

let fpdfPromise: Promise<FPDF>;
let fpdf: FPDF;
let fpdfPath: string;
let buffer: {
  pointer: number;
  size: number;
};
let handle: number;
let pageCount: number;

// for error logging & debugging purposes
const shouldSendToBucketOnError = true;

self.onmessage = async (event: MessageEvent) => {
  const { id, type, data } = event.data;
  let transfer: Transferable[] | undefined = undefined;

  const response: PDFiumWorkerResponse = { id };

  if (type === PDFiumWorkerMessageType.INIT) {
    fpdfPath = data;
    fpdfPromise = getFPDF(fpdfPath).then((lib) => {
      // begin initilizing library
      lib.Init();
      return lib;
    });
    self.postMessage(response);
    return;
  } else if (!fpdf) {
    // ensure library is initialized
    fpdf = await fpdfPromise;
  } else if (!fpdfPath) {
    self.postMessage({
      ...response,
      error: { name: 'Error in worker', message: 'PDFium is not initialized' },
    });
    return;
  }
  //#region Message Handling
  try {
    switch (type) {
      case PDFiumWorkerMessageType.CREATE_BUFFER:
        createDocumentBuffer(data);
        break;
      case PDFiumWorkerMessageType.LOAD_DOCUMENT:
        const loadDocumentResponse = loadDocumentFromBuffer(data);
        response.data = loadDocumentResponse;
        transfer = [loadDocumentResponse.thumbnail.data.array];
        break;
      case PDFiumWorkerMessageType.GET_METADATA:
        response.data = getMetadata();
        break;
      case PDFiumWorkerMessageType.GET_DOCUMENT_CONTENT:
        const documentContentResponse = getDocumentContent(data);
        response.data = documentContentResponse;
        transfer = documentContentResponse
          .map((pageContent) => [
            pageContent.text,
            pageContent.image.data.array,
          ])
          .flat();
        break;
      case PDFiumWorkerMessageType.GET_PAGE_CONTENT:
        const pageContentResponse = getPageContent(data);
        response.data = pageContentResponse;
        transfer = [pageContentResponse.data.array];
        break;
      case PDFiumWorkerMessageType.GET_ANNOTATED_PDF:
        const rawAnnotatedPDF = applyAnnotationsAndExport(
          data.drawingChunks,
          data.pageRange,
        );
        transfer = [rawAnnotatedPDF];
        response.data = rawAnnotatedPDF;
        break;
      case PDFiumWorkerMessageType.CREATE_SPLIT_DOCUMENT:
        const rawCreatedPDF = generateSplitDocument(
          data.leftRawData,
          data.rightRawData,
          data.exportType,
        );
        response.data = rawCreatedPDF;
        transfer = [rawCreatedPDF];
        break;
      case PDFiumWorkerMessageType.GET_BUFFER:
        const arrayBuffer = getDocumentBuffer(data.pageRange);
        transfer = [arrayBuffer];
        response.data = arrayBuffer;
        break;
      case PDFiumWorkerMessageType.GET_STANDARDIZED_PDF:
        const standardizedPDF = getStandardizedPDF(
          data.pageRange,
          data.pageIndices,
        );
        transfer = [standardizedPDF];
        response.data = standardizedPDF;
        break;
      case PDFiumWorkerMessageType.DESTROY:
        destroy();
        break;
      default:
        throw new UnknownMessageException();
    }
  } catch (e) {
    if (e instanceof Error) {
      response.error = {
        name: e.name,
        message: e.message,
        stack: e.stack,
      };
    } else {
      response.error = e;
    }

    if (!(e instanceof PasswordException)) {
      sendToBucket();
    }
  }
  self.postMessage(response, { transfer });
};

/**
 * Loads a page and flattens it to apply any annotations and form data to the page.
 */
const loadPageAndFlatten = (
  pageIndex: number,
  selectedHandle: number = handle,
): number => {
  const pageHandle = fpdf.LoadPage(selectedHandle, pageIndex);
  fpdf.Page_Flatten(pageHandle, 0);
  // not mentioned in documentation, but required to close page and re-open for flattening to apply
  fpdf.ClosePage(pageHandle);
  return fpdf.LoadPage(selectedHandle, pageIndex);
};

const getDocumentContent = (
  pageRange: PageRange,
): PDFiumDocumentContentResponse => {
  if (pageRange.to > pageCount) {
    throw new InvalidPDFException('Page range exceeds document page count');
  } else if (pageRange.from < 1) {
    throw new InvalidPDFException('Page range cannot start before first page');
  } else if (pageRange.from > pageRange.to) {
    throw new InvalidPDFException('Page range end cannot be before start');
  }

  const numPages = pageRange.to - pageRange.from + 1; // to and from are inclusive, one-based indexing
  const content: PDFiumDocumentContentResponse = [];

  for (let i = 0; i < numPages; i++) {
    const pageIndex = pageRange.from + i - 1; // must convert to index (zero-based)
    const pageHandle = loadPageAndFlatten(pageIndex);

    if (!pageHandle) {
      throw new MemoryException('Unable to load page');
    }

    const textPageHandle = fpdf.Text_LoadPage(pageHandle);

    if (!textPageHandle) {
      fpdf.ClosePage(pageHandle);
      throw new MemoryException('Unable to load text page');
    }

    try {
      const { text, chunks } = getPageText(textPageHandle);
      const image = getPageImage(pageHandle);
      content.push({ text, image, chunks });
    } catch (error) {
      throw error;
    } finally {
      fpdf.Text_ClosePage(textPageHandle);
      fpdf.ClosePage(pageHandle);
    }
  }

  return content;
};

/**
 * Per PDFium documentation, this function only works in conjuction with APIs
 * that mention it in their documentation.
 *
 * As of version 6662, we only use it in `loadDocumentFromBuffer`.
 */
const checkLastFpdfError = () => {
  const error = fpdf.GetLastError();
  switch (error) {
    case FPDFError.SUCCESS:
      return;
    case FPDFError.FILE:
    case FPDFError.FORMAT:
      throw new InvalidPDFException();
    case FPDFError.PASSWORD:
      throw new PasswordException();
    default:
      throw new UnknownException();
  }
};

/**
 * only destory / free if it exists, it will error out if we try to free a null ptr
 * these could be potentially null ptrs when we make a worker to export.
 */
const destroy = () => {
  if (handle) {
    fpdf.CloseDocument(handle);
  }
  if (buffer) {
    // ptr exists only if buffer exists.
    fpdf.free(buffer.pointer);
  }
  fpdf.Destroy();
};

// #region Document Creation

const createDocumentBuffer = (documentArray: ArrayBuffer) => {
  const size = documentArray.byteLength;
  const pointer = fpdf.malloc(size);

  if (!pointer) {
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for document',
    );
  }

  fpdf.HEAPU8.set(new Uint8Array(documentArray), pointer);
  buffer = { pointer, size };
};

const loadDocumentFromBuffer = (
  password: string = '',
): PDFiumDocumentResponse => {
  const document = fpdf.LoadMemDocument(buffer.pointer, buffer.size, password);

  if (!document) {
    checkLastFpdfError();
  }

  handle = document;

  pageCount = fpdf.GetPageCount(handle);
  const thumbnail = getThumbnail();

  return { pageCount, thumbnail };
};

const combineInt8Arrays = (arrays: Int8Array[]): ArrayBuffer => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const combinedBuffer = new ArrayBuffer(totalLength);
  const combinedInt8Array = new Int8Array(combinedBuffer);
  let offset = 0;
  arrays.forEach((arr) => {
    combinedInt8Array.set(arr, offset);
    offset += arr.length;
  });
  return combinedBuffer;
};

const mallocString = (str: string) => {
  const utf8String = new TextEncoder().encode(str);
  const charPtr = fpdf.malloc(
    fpdf.HEAPU8.BYTES_PER_ELEMENT * (utf8String.byteLength + 1),
  );
  fpdf.HEAPU8.set(utf8String, charPtr);
  fpdf.HEAPU8[charPtr + utf8String.byteLength] = 0;
  // null, don't need to divide by BYTES_PER_ELEMENT since we're already dealing with bytes.
  return charPtr;
};

const generateSplitDocument = (
  leftRawData: ArrayBuffer,
  rightRawData: ArrayBuffer,
  exportType: RichTextExportType,
): ArrayBuffer => {
  if (leftRawData.byteLength === 0 || rightRawData.byteLength === 0) {
    throw new MemoryException(
      'No raw data provided for one/both of the documents',
    );
  }

  // create two document buffers
  const leftPtr = fpdf.malloc(leftRawData.byteLength);
  const rightPtr = fpdf.malloc(rightRawData.byteLength);

  if (!leftPtr || !rightPtr) {
    // shouldn't happen, but just in case.
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for split document',
    );
  }

  fpdf.HEAPU8.set(new Uint8Array(leftRawData), leftPtr);
  fpdf.HEAPU8.set(new Uint8Array(rightRawData), rightPtr);

  const leftDoc = fpdf.LoadMemDocument(leftPtr, leftRawData.byteLength, '');
  const rightDoc = fpdf.LoadMemDocument(rightPtr, rightRawData.byteLength, '');
  const leftCount = fpdf.GetPageCount(leftDoc);
  const rightCount = fpdf.GetPageCount(rightDoc);
  const maxPageCount = Math.max(leftCount, rightCount);

  const inBetweenDoc = fpdf.CreateNewDocument();
  const indicePtr = fpdf.malloc(fpdf.HEAP32.BYTES_PER_ELEMENT);
  for (let i = 0; i < maxPageCount; i++) {
    // set up page indice pointer (since importPagesByIndex requires a int ptr)
    fpdf.HEAP32[indicePtr / fpdf.HEAP32.BYTES_PER_ELEMENT] = i;
    splitDocHelper(i, leftCount, leftDoc, inBetweenDoc, indicePtr, 0);
    splitDocHelper(i, rightCount, rightDoc, inBetweenDoc, indicePtr, 1);
  }
  fpdf.free(indicePtr);

  let finalDoc;
  if (exportType === RichTextExportType.SplitView) {
    finalDoc = fpdf.ImportNPagesToOne(
      inBetweenDoc,
      LETTER_PAPER_HEIGHT,
      LETTER_PAPER_WIDTH,
      2,
      1,
    );
    const pageCount = fpdf.GetPageCount(finalDoc);
    for (let i = 0; i < pageCount; i++) {
      const page = fpdf.LoadPage(finalDoc, i);
      const path = fpdf.PageObj_CreateNewPath(LETTER_PAPER_HEIGHT / 2, 0);
      fpdf.PageObj_SetStrokeWidth(path, 1);
      fpdf.PageObj_SetStrokeColor(path, 199, 202, 209, 255);
      fpdf.Path_SetDrawMode(path, 0, true);
      fpdf.Path_LineTo(path, 792 / 2, LETTER_PAPER_WIDTH);
      fpdf.Page_InsertObject(page, path);
      fpdf.Page_GenerateContent(page);
      fpdf.ClosePage(page);
    }
    fpdf.CloseDocument(inBetweenDoc);
  } else {
    finalDoc = inBetweenDoc;
  }

  const data = savePDFData(finalDoc);

  // Clean up
  fpdf.CloseDocument(leftDoc);
  fpdf.CloseDocument(rightDoc);
  fpdf.CloseDocument(finalDoc);
  fpdf.free(leftPtr);
  fpdf.free(rightPtr);
  return data;
};

const splitDocHelper = (
  i: number,
  sideCount: number,
  fromDocHandle: number,
  toDocHandle: number,
  indicePtr: number,
  offset: number,
) => {
  if (i < sideCount) {
    fpdf.ImportPagesByIndex(
      toDocHandle,
      fromDocHandle,
      indicePtr,
      1,
      i * 2 + offset,
    );
  } else {
    fpdf.ClosePage(
      fpdf.Page_New(
        toDocHandle,
        i * 2 + offset,
        LETTER_PAPER_WIDTH,
        LETTER_PAPER_HEIGHT,
      ),
    );
  }
};

/**
 * SavePDFData- More complex than simply calling a save method, this requires
 * a custom write function to be passed in as a callback for pdfium to use.
 * The write is done as blocks so what we do is we write each block to a TypedArray
 * and then combine them at the end.
 */
const savePDFData = (docHandle: number): ArrayBuffer => {
  const writeToJS = (_pThis: number, pData: number, size: number): number => {
    try {
      const block = fpdf.HEAP8.slice(pData, pData + size);
      dataBlock.push(block);
      return 1;
    } catch (e) {
      return 0;
    }
  };
  const dataBlock: Int8Array[] = [];
  const writeBlock = fpdf.addFunction(writeToJS, 'iiii');
  const jsFileWriteStruct = fpdf.malloc(fpdf.HEAP32.BYTES_PER_ELEMENT * 2);
  fpdf.HEAP32[jsFileWriteStruct / fpdf.HEAP32.BYTES_PER_ELEMENT] = 1; // version
  fpdf.HEAP32[jsFileWriteStruct / fpdf.HEAP32.BYTES_PER_ELEMENT + 1] =
    writeBlock; // write fn
  fpdf.SaveAsCopy(docHandle, jsFileWriteStruct, 3);
  fpdf.free(jsFileWriteStruct);
  fpdf.removeFunction(writeBlock);
  return combineInt8Arrays(dataBlock);
};

const BATCH_SIZE = 100;

const applyAnnotationsAndExport = (
  drawingChunks: RichTextDrawingChunk[],
  pageRange: PageRange,
): ArrayBuffer => {
  const startingPage = pageRange.from;
  let batchFromIndex = startingPage;

  const endPage = pageRange.to;
  let batchToIndex = Math.min(endPage, startingPage + BATCH_SIZE);

  const finalDoc = fpdf.CreateNewDocument();

  let chunkIndex = 0;
  let chunk = drawingChunks[chunkIndex];

  const drawingChunksLength = drawingChunks.length;

  while (batchFromIndex <= endPage) {
    const batchDoc = fpdf.CreateNewDocument();

    // Important: I know this seems silly, but importing the pages 1 by 1 into the new document
    // does produce a cleaner document, preventing issues on some documents where the annotations
    // don't correctly show the alpha value on some pages.
    for (
      let pageIndex = batchFromIndex;
      pageIndex <= batchToIndex;
      pageIndex++
    ) {
      const singlePage = mallocString(`${pageIndex}`);
      const pageIndexInBatch = pageIndex - batchFromIndex;

      fpdf.ImportPages(batchDoc, handle, singlePage, pageIndexInBatch);
      fpdf.free(singlePage);

      const pageHandle = loadPageAndFlatten(pageIndexInBatch, batchDoc);

      while (
        chunkIndex < drawingChunksLength &&
        chunk.pageIndex === pageIndex - startingPage
      ) {
        drawHighlightToPage(pageHandle, chunk);

        chunkIndex++;
        chunk = drawingChunks[chunkIndex];
      }

      fpdf.Page_GenerateContent(pageHandle);
      fpdf.ClosePage(pageHandle);
    }

    fpdf.ImportPages(finalDoc, batchDoc, null, batchFromIndex - startingPage);
    fpdf.CloseDocument(batchDoc);

    batchFromIndex = batchToIndex + 1;
    batchToIndex = Math.min(batchToIndex + BATCH_SIZE, endPage);
  }

  const data = savePDFData(finalDoc);
  fpdf.CloseDocument(finalDoc);
  return data;
};

const getDocumentBuffer = (pageRange: PageRange): ArrayBuffer => {
  const newDoc = fpdf.CreateNewDocument();
  const pageRanges = mallocString(`${pageRange.from}-${pageRange.to}`);
  fpdf.ImportPages(newDoc, handle, pageRanges, 0);
  const data = savePDFData(newDoc);
  fpdf.free(pageRanges);
  return data;
};

const standardizePage = (pageHandle: number) => {
  const width = fpdf.GetPageWidthF(pageHandle);
  const height = fpdf.GetPageHeightF(pageHandle);

  // allocates memory for the transformation matrix: 6 float32 values (4 bytes each)
  const matrixPtr = fpdf.malloc(6 * 4);

  const widthScale = LETTER_PAPER_WIDTH / width;
  const heightScale = LETTER_PAPER_HEIGHT / height;

  // writes the transformation matrix to the allocated memory location
  fpdf.HEAPF32.set([widthScale, 0, 0, heightScale, 0, 0], matrixPtr / 4);

  const objectCount = fpdf.Page_CountObjects(pageHandle);
  for (let objectIndex = 0; objectIndex < objectCount; objectIndex++) {
    const object = fpdf.Page_GetObject(pageHandle, objectIndex);
    fpdf.PageObj_TransformF(object, matrixPtr);
  }

  /**
   * Set all PDF page boxes (Media, Crop, Bleed, Trim, Art) explicitly to ensure
   * consistent page dimensions across different PDF viewers, as viewers may use
   * different default values if boxes are not defined.
   */

  fpdf.Page_SetMediaBox(
    pageHandle,
    0,
    0,
    LETTER_PAPER_WIDTH,
    LETTER_PAPER_HEIGHT,
  );

  fpdf.Page_SetCropBox(
    pageHandle,
    0,
    0,
    LETTER_PAPER_WIDTH,
    LETTER_PAPER_HEIGHT,
  );

  // Extends page bounds by 1/8 inch (9pt) for print bleed area.
  // This extra margin ensures colors/images extend beyond trim line, preventing white edges from cutting variations
  fpdf.Page_SetBleedBox(
    pageHandle,
    -9,
    -9,
    LETTER_PAPER_WIDTH + 9,
    LETTER_PAPER_HEIGHT + 9,
  );

  fpdf.Page_SetTrimBox(
    pageHandle,
    0,
    0,
    LETTER_PAPER_WIDTH,
    LETTER_PAPER_HEIGHT,
  );

  fpdf.Page_SetArtBox(
    pageHandle,
    0,
    0,
    LETTER_PAPER_WIDTH,
    LETTER_PAPER_HEIGHT,
  );

  fpdf.Page_GenerateContent(pageHandle);
  fpdf.free(matrixPtr);
};

const getStandardizedPDF = (
  pageRange: PageRange,
  pageIndices: number[],
): ArrayBuffer => {
  const newDoc = fpdf.CreateNewDocument();
  const pageRanges = mallocString(`${pageRange.from}-${pageRange.to}`);
  fpdf.ImportPages(newDoc, handle, pageRanges, 0);
  fpdf.free(pageRanges);

  pageIndices.forEach((pageIndex) => {
    const pageHandle = fpdf.LoadPage(newDoc, pageIndex);
    standardizePage(pageHandle);
    fpdf.ClosePage(pageHandle);
  });

  const data = savePDFData(newDoc);
  fpdf.CloseDocument(newDoc);
  return data;
};

const DIFFCHECKER_HIGHLIGHT_COLORS = {
  // colors in rgba 0-255 format
  [RichTextDiffType.Remove]: [223, 32, 32, 102], // RED
  [RichTextDiffType.Insert]: [0, 153, 102, 102], // GREEN
  [RichTextDiffType.StyleChange]: [165, 76, 254, 75], // PURPLE
  [RichTextDiffType.Move]: [0, 127, 255, 75], // BLUE
};

const drawHighlightToPage = (
  pageHandle: number,
  drawingChunk: RichTextDrawingChunk,
) => {
  const { diffType, top, bottom, left, right } = drawingChunk;
  // pageIndices and boxes are anticipated to be increasing in order in terms of page numbers.
  const color = DIFFCHECKER_HIGHLIGHT_COLORS[diffType];
  const newHighlight = fpdf.PageObj_CreateNewRect(
    left,
    bottom,
    right - left,
    top - bottom,
  );
  if (diffType === RichTextDiffType.StyleChange) {
    fpdf.PageObj_SetStrokeColor(
      newHighlight,
      color[0],
      color[1],
      color[2],
      color[3],
    );
    fpdf.PageObj_SetStrokeWidth(newHighlight, 1);
    fpdf.Path_SetDrawMode(newHighlight, 0, true);
  } else {
    fpdf.PageObj_SetFillColor(
      newHighlight,
      color[0],
      color[1],
      color[2],
      color[3],
    );
    fpdf.PageObj_SetStrokeWidth(newHighlight, 0);
    fpdf.Path_SetDrawMode(newHighlight, 1, false);
  }
  fpdf.Page_InsertObject(pageHandle, newHighlight);
};

const getThumbnail = (): PDFiumImageResponse => {
  const pageHandle = loadPageAndFlatten(0);

  if (!pageHandle) {
    throw new MemoryException('Unable to load first page for thumbnail');
  }

  const { width: originalWidth, height: originalHeight } =
    getPageDimensions(pageHandle);

  const xScale = THUMBNAIL_MAX_WIDTH / originalWidth; // what to scale the height by if width is larger
  const yScale = THUMBNAIL_MAX_HEIGHT / originalHeight; // what to scale the width by if height is larger

  let width: number;
  let height: number;

  if (xScale < yScale) {
    width = THUMBNAIL_MAX_WIDTH;
    height = Math.floor(originalHeight * xScale);
  } else {
    width = Math.floor(originalWidth * yScale);
    height = THUMBNAIL_MAX_HEIGHT;
  }

  const data = getPageImageData(pageHandle, width, height);

  fpdf.ClosePage(pageHandle);

  return {
    data,
    width,
    height,
  };
};

// #region Page Images

const getPageDimensions = (
  pageHandle: number,
): { width: number; height: number } => ({
  width: fpdf.GetPageWidthF(pageHandle),
  height: fpdf.GetPageHeightF(pageHandle),
});

const getPageImageData = (
  pageHandle: number,
  imageWidth: number,
  imageHeight: number,
): PDFiumImageData => {
  const width = imageWidth * IMAGE_DATA_SCALE;
  const height = imageHeight * IMAGE_DATA_SCALE;

  const bitmapHandle = fpdf.Bitmap_Create(width, height, 0);

  if (!bitmapHandle) {
    throw new MemoryException('Unable to create bitmap');
  }

  const bitmapBuffer = fpdf.Bitmap_GetBuffer(bitmapHandle);
  fpdf.Bitmap_FillRect(bitmapHandle, 0, 0, width, height, 0xffffff);
  fpdf.RenderPageBitmap(
    bitmapHandle,
    pageHandle,
    0,
    0,
    width,
    height,
    0,
    FPDFRenderFlag.REVERSE_BYTE_ORDER,
  );

  const array = fpdf.HEAPU8.slice(
    bitmapBuffer,
    bitmapBuffer + width * height * 4, // 4 bytes per pixel
  ).buffer;

  fpdf.Bitmap_Destroy(bitmapHandle);
  return { array, width, height };
};

const getPageImage = (pageHandle: number): PDFiumImageResponse => {
  const { width, height } = getPageDimensions(pageHandle);
  return {
    width,
    height,
    data: {
      array: new ArrayBuffer(0),
      width: IMAGE_DATA_SCALE * Math.floor(width),
      height: IMAGE_DATA_SCALE * Math.floor(height),
    },
  };
};

const getPageContent = (pageIndex: number): PDFiumImageResponse => {
  let imageContent: PDFiumImageResponse;
  const pageHandle = loadPageAndFlatten(pageIndex);
  if (!pageHandle) {
    throw new MemoryException('Unable to load page');
  }

  try {
    const { width, height } = getPageDimensions(pageHandle);
    imageContent = {
      width,
      height,
      data: getPageImageData(pageHandle, Math.floor(width), Math.floor(height)),
    };
  } catch (error) {
    throw error;
  } finally {
    fpdf.ClosePage(pageHandle);
  }

  return imageContent;
};

// #region Text Extraction

interface LineChunk {
  text: string;
  y: [top: number, bottom: number];
  x: [left: number, right: number][];
  fontFamily: string;
  fontSize: number;
  color: string;
}

interface TempPDFiumChunk extends PDFiumChunk {
  temp?: {
    left: number;
    lineHeight: number;
  };
}

const getPageText = (
  textPageHandle: number,
): { text: ArrayBuffer; chunks: PDFiumChunk[] } => {
  const { text, lines } = getPageLines(textPageHandle);
  const chunks = groupIntoParagraphs(lines);
  const textBuffer = new TextEncoder().encode(text);
  if (!(textBuffer.buffer instanceof ArrayBuffer)) {
    throw new Error('Expected ArrayBuffer from TextEncoder');
  }
  return { text: textBuffer.buffer, chunks };
};

const groupIntoParagraphs = (lines: LineChunk[]): PDFiumChunk[] => {
  if (lines.length === 0) {
    return [];
  }

  const paragraphs: PDFiumChunk[] = [];
  const { text, x, y, fontFamily, fontSize, color } = lines[0];
  let currParagraph: TempPDFiumChunk = {
    text: [text],
    y: [y],
    x: [x],
    fontFamily,
    fontSize,
    color,
  };

  for (let i = 1; i < lines.length; i++) {
    const { text, x, y, fontFamily, fontSize, color } = lines[i];

    // TODO: minor clarity refactor
    let isSameStyle = true;
    let isSameParagraph = true;

    if (
      currParagraph.fontFamily !== fontFamily ||
      currParagraph.fontSize !== fontSize ||
      currParagraph.color !== color
    ) {
      isSameStyle = false;
    } else {
      // skip everything else if the styles aren't even the same, since they should be in separate chunks

      const lineLeft = x[0][0];
      const lineTop = y[0];

      const prevLineTop = currParagraph.y[currParagraph.y.length - 1][0];
      const prevLineRight =
        currParagraph.x[currParagraph.x.length - 1][
          currParagraph.x[currParagraph.x.length - 1].length - 1
        ][1];
      // const prevLineRight = currParagraph.x[currParagraph.x.length - 1][0][1];

      if (lineTop > prevLineTop || lineLeft > prevLineRight) {
        // new line is above or to the right of previous line
        isSameParagraph = false;
      } else if (currParagraph.text.length === 1 || !currParagraph.temp) {
        // the current paragraph only has one line, so we need to attach temporary data to it in order to check future lines
        // TODO: handle centering? (check center of line approximately matches center of prev line)

        const currParaLeft = currParagraph.x[0][0][0];
        const currParaTop = currParagraph.y[0][0];

        const lineHeight = currParaTop - lineTop;
        const charHeight = y[0] - y[1];

        // if line height is greater than 1.5 times the character height, then it is a new paragraph
        if (charHeight * SAME_PARAGRAPH_CHAR_HEIGHT_MULTIPLIER < lineHeight) {
          isSameParagraph = false;
        } else if (currParaLeft === lineLeft) {
          // left is aligned
          currParagraph.temp = {
            left: currParaLeft,
            lineHeight,
          };
        } else if (lineLeft > currParaLeft) {
          // new line is indented compared to previous line
          isSameParagraph = false;
        } else if (lineLeft < currParaLeft) {
          // new line is further left than previous, meaning previous line was indented
          currParagraph.temp = {
            left: lineLeft,
            lineHeight,
          };
        }
      } else {
        if (lineLeft !== currParagraph.temp.left) {
          // line is not left aligned
          isSameParagraph = false;
        } else if (
          prevLineTop - lineTop >
          currParagraph.temp.lineHeight + 0.5 // not a precision error, but a different-characters-have-different-heights error. 0.5 is more generous to catch more edge cases.
        ) {
          // line height is greater than previous line height
          isSameParagraph = false;
        }

        // TODO: handle centering?
        // TODO: split in the case where line height is less than previous line height
      }
    }

    if (!isSameStyle || !isSameParagraph) {
      delete currParagraph.temp; // remove excess data if it exists for memory optimization
      paragraphs.push(currParagraph);
      currParagraph = {
        text: [text],
        y: [y],
        x: [x],
        fontFamily,
        fontSize,
        color,
      };
    } else {
      currParagraph.text.push(text);
      currParagraph.x.push(x);
      currParagraph.y.push(y);
    }
  }

  delete currParagraph.temp; // remove excess data if it exists for memory optimization
  paragraphs.push(currParagraph);

  return paragraphs;
};

/**
 * Groups text on the page into lines.
 * TODO: description
 *
 */
const getPageLines = (
  textPageHandle: number,
): { text: string; lines: LineChunk[] } => {
  const numChars = fpdf.Text_CountChars(textPageHandle);

  if (numChars < 0) {
    throw new MemoryException('Unable to count characters in page');
  } else if (numChars === 0) {
    return { text: '', lines: [] };
  }

  const lines: LineChunk[] = [];
  let text = '';
  let currLine: LineChunk = {
    text: '',
    fontFamily: '',
    fontSize: 0,
    color: '',
    y: [0, 0],
    x: [],
  };
  let lastChar = '';

  for (let i = 0; i < numChars; i++) {
    if (fpdf.Text_HasUnicodeMapError(textPageHandle, i) !== 0) {
      // Skip characters with unicode map errors.
      continue;
    }

    const char = getDocumentTextChar(fpdf.Text_GetUnicode(textPageHandle, i));

    if (
      (char === ' ' && currLine.text[currLine.text.length - 1] === ' ') ||
      char === ''
    ) {
      /**
       * Skip excess whitespace so we don't have to handle multiple this case. This is because
       * spaces may or may not have font data, and different PDF encoders may or may not combine
       * multiple spaces into a single space.
       */
      continue;
    }

    const box = getCharBoxInfo(textPageHandle, i);
    const fontFamily = getCharFontFamily(textPageHandle, i);
    const color = getCharColor(textPageHandle, i);

    // TODO: need to obtain font size via bounding box, as sometimes the font size is not available
    const fontSize = Math.round((box.top - box.bottom) * 100) / 100;

    const sameLinePosition = isSameLinePosition(currLine, char, box);
    const sameStyle = isSameStyle(currLine, char, fontFamily, fontSize, color);

    if (!sameLinePosition || !sameStyle) {
      if (
        currLine.text.length > 1 &&
        currLine.text[currLine.text.length - 1] === ' ' &&
        ((box.top >= currLine.y[0] && box.bottom <= currLine.y[1]) ||
          (currLine.y[0] >= box.top && currLine.y[1] <= box.bottom))
      ) {
        // The previous character was a space and is on the same line even if style is different, so we need to extend x bounds to the right
        currLine.x[currLine.x.length - 1][1] = box.left;
      }

      if (currLine.text !== '') {
        lines.push(currLine);
      }

      currLine = {
        text: '',
        fontFamily,
        fontSize,
        color,
        y: [box.top, box.bottom],
        x: [],
      };
    }

    // special processing to add spaces at the end of each line. improves overall pdfdiff quality.
    if (
      lines.length > 0 &&
      lastChar !== ' ' &&
      char !== '-\n' &&
      char.endsWith('\n')
    ) {
      const lastXIndex = lines[lines.length - 1].x.length - 1;
      const lastX = lines[lines.length - 1].x[lastXIndex];
      // add space if prev character is followed by a newline
      lines[lines.length - 1].text += ' ';
      lines[lines.length - 1].x.push([lastX[1], lastX[1]]);
    }

    addCharToLine(currLine, char, box);
    text += char;
    lastChar = char;
  }

  // special handling to add space at the last line if it doesn't end with a space.
  if (currLine.text !== '') {
    if (!currLine.text.endsWith(' ')) {
      currLine.text += ' ';
      currLine.x.push([
        currLine.x[currLine.x.length - 1][1],
        currLine.x[currLine.x.length - 1][1],
      ]);
    }
    lines.push(currLine);
  }

  return { text, lines };
};

const addCharToLine = (currLine: LineChunk, char: string, box: BoundingBox) => {
  /**
   * A loop is required here in case of multiple characters. This typically only happens
   * with newlines, but it is better to handle it here to catch other edge cases.
   */
  for (let i = 0; i < char.length; i++) {
    if (char[i] === '\n') {
      continue;
    }

    currLine.text += char[i];
    currLine.x.push([box.left, box.right]);
  }
};

const isSameLinePosition = (
  currLine: LineChunk,
  char: string,
  box: BoundingBox,
) => {
  if (currLine.text === '') {
    // The current line is empty, so this will return true, but we need to set the y bounds.
    currLine.y = [box.top, box.bottom];
    return true;
  }

  const y = currLine.y;
  const x = currLine.x[currLine.x.length - 1];

  // Spaces must be checked on their own, as they may or may not have properly set bounds.
  if (char === ' ') {
    const isCharInLine = y[0] >= box.top && y[1] <= box.bottom;

    // If the space is on the same line, we will update the space's bounding box to match.
    if (isCharInLine) {
      box.top = y[0];
      box.bottom = y[1];
      box.left = x[1];
      box.right = x[1];
    }

    return isCharInLine;
  }

  /**
   * In the rare case, the current line is only a space that may or may not have properly
   * set bounds.
   *
   * Note that there will be no space added immediately after in this case, as we skip
   * excess whitespace prior to this point.
   */
  if (currLine.text === ' ') {
    const isSpaceInCharBounds = box.top >= y[0] && box.bottom <= y[1];

    // If the space is on the same line, we will update the space's bounding box to match.
    if (isSpaceInCharBounds) {
      y[0] = box.top;
      y[1] = box.bottom;
      x[0] = box.left;
      x[1] = box.left;
    }

    return isSpaceInCharBounds;
  }

  const topAndBottomMatch = y[0] === box.top && y[1] === box.bottom;

  if (topAndBottomMatch && currLine.text[currLine.text.length - 1] === ' ') {
    // The previous character was a space, so we need to extend x bounds to the right
    x[1] = box.left;
  }

  return topAndBottomMatch;
};

const isSameStyle = (
  currLine: LineChunk,
  char: string,
  fontFamily: string,
  fontSize: number,
  color: string,
) => {
  if (currLine.text === '' || currLine.text === ' ') {
    /**
     * The current line is empty, so we need to set the font data. Occasionally spaces do not have
     * font data, so we need to handle this case as well.
     */
    currLine.fontFamily = fontFamily;
    currLine.fontSize = fontSize;
    currLine.color = color;
    return true;
  } else if (char === ' ') {
    // The new char is a space, which sometimes doesn't have font data, so we assume it is the same.
    return true;
  }

  const fontFamilySame = currLine.fontFamily === fontFamily;
  const fontSizeSame = currLine.fontSize === fontSize;
  const colorSame = currLine.color === color;

  return fontFamilySame && fontSizeSame && colorSame;
};

// #region Character Data

/**
 * Parses font name based on PDF 1.7 spec, section 9.6.4.
 *
 * Font subsets start with uppercase characters and a plus sign (eg. 'AAAAAA+').
 */
const parseFontName = (name: string): string =>
  name[6] === '+' ? name.substring(7) : name;

const getCharFontFamily = (
  textPageHandle: number,
  charIndex: number,
): string => {
  const fontBufferByteLength = fpdf.Text_GetFontInfo(textPageHandle, charIndex);
  if (!fontBufferByteLength) {
    return '';
  }

  let fontFamily = '';

  const buffer = fpdf.malloc(fontBufferByteLength);

  if (!buffer) {
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for font family',
    );
  }

  const flags = fpdf.malloc(fpdf.HEAP32.BYTES_PER_ELEMENT); // TODO: handle flags based on spec, if needed

  if (!flags) {
    fpdf.free(buffer);
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for font flags',
    );
  }

  const fontByteLength = fpdf.Text_GetFontInfo(
    textPageHandle,
    charIndex,
    buffer,
    fontBufferByteLength,
    flags,
  ); // includes terminating character, will be equal to fontBufferByteLength

  if (!fontByteLength) {
    fpdf.free(buffer);
    fpdf.free(flags);
    throw new MemoryException('Unable to obtain font info');
  }

  const heapIndex = buffer / fpdf.HEAPU8.BYTES_PER_ELEMENT;
  fontFamily = parseFontName(
    new TextDecoder('utf-8').decode(
      // buffer is encoded in UTF-8
      fpdf.HEAPU8.slice(
        heapIndex,
        heapIndex + (fontByteLength - 1) / fpdf.HEAPU8.BYTES_PER_ELEMENT, // no need for terminating character
      ),
    ),
  );
  fpdf.free(buffer);
  fpdf.free(flags);

  return fontFamily;
};

const getCharColor = (textPageHandle: number, index: number): string => {
  let color = '';

  const firstPointer = fpdf.malloc(fpdf.HEAPU32.BYTES_PER_ELEMENT * 4);

  if (!firstPointer) {
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for color',
    );
  }

  const pointers = [
    firstPointer,
    firstPointer + fpdf.HEAPU32.BYTES_PER_ELEMENT,
    firstPointer + fpdf.HEAPU32.BYTES_PER_ELEMENT * 2,
    firstPointer + fpdf.HEAPU32.BYTES_PER_ELEMENT * 3,
  ];

  if (
    fpdf.Text_GetFillColor(
      textPageHandle,
      index,
      pointers[0],
      pointers[1],
      pointers[2],
      pointers[3],
    )
  ) {
    color = '#';
    pointers.forEach((pointer, index) => {
      if (index === 3) {
        return;
      } // do not need to handle alpha
      let hex =
        fpdf.HEAP32[pointer / fpdf.HEAPU32.BYTES_PER_ELEMENT].toString(16);
      if (hex.length == 1) {
        hex = '0' + hex;
      }
      color += hex;
    });
  }

  fpdf.free(firstPointer);

  return color;
};

const getCharBoxInfo = (textPageHandle: number, index: number) => {
  const originPointer = fpdf.malloc(fpdf.HEAPF64.BYTES_PER_ELEMENT * 2);

  if (!originPointer) {
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for origin',
    );
  }

  const boxPointer = fpdf.malloc(fpdf.HEAPF32.BYTES_PER_ELEMENT * 4);

  if (!originPointer) {
    fpdf.free(originPointer);
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for bounding box',
    );
  }

  let box: BoundingBox = { left: -1, right: -1, top: -1, bottom: -1 };

  if (fpdf.Text_GetLooseCharBox(textPageHandle, index, boxPointer)) {
    const heapIndex = boxPointer / fpdf.HEAPF32.BYTES_PER_ELEMENT;
    box = {
      left: fpdf.HEAPF32[heapIndex],
      top: fpdf.HEAPF32[heapIndex + 1],
      right: fpdf.HEAPF32[heapIndex + 2],
      bottom: fpdf.HEAPF32[heapIndex + 3],
    };

    if (
      fpdf.Text_GetCharOrigin(
        textPageHandle,
        index,
        originPointer,
        originPointer + fpdf.HEAPF64.BYTES_PER_ELEMENT,
      )
    ) {
      const charWidth = box.right - box.left;
      const charHeight = box.top - box.bottom;

      const heapIndex = originPointer / fpdf.HEAPF64.BYTES_PER_ELEMENT;
      const x = fpdf.HEAPF64[heapIndex];
      const textBaseline = fpdf.HEAPF64[heapIndex + 1];
      const y = textBaseline - charHeight * 0.25; // using 25% of the full height as an approximation for the descent height

      box = {
        left: x,
        right: x + charWidth,
        top: y + charHeight,
        bottom: y,
      };
    }
  }

  fpdf.free(originPointer);
  fpdf.free(boxPointer);
  return box;
};

const getDocumentTextChar = (value: number): string => {
  switch (value) {
    case 0x0002: // eol hyphen
    case 0xfffe: // eol hyphen
      return '-\n';
    case 0x000d: // carriage return
    case 0x0004: // eot
      return '';
    case 0x0009: // tab
      return ' ';
    default:
      return String.fromCodePoint(value);
  }
};

// #region Metadata

const getMetadata = (): PDFiumMetadataResponse => {
  const metadata: PDFiumMetadataResponse = {};

  const versionPointer = fpdf.malloc(fpdf.HEAPU32.BYTES_PER_ELEMENT);

  if (!versionPointer) {
    throw new MemoryException(
      'Array buffer allocation failed, unable to allocate memory for metadata: version pointer',
    );
  }

  const hasVersion = fpdf.GetFileVersion(handle, versionPointer);
  if (hasVersion) {
    const version =
      fpdf.HEAPU32[versionPointer / fpdf.HEAPU32.BYTES_PER_ELEMENT].toString();
    metadata.formatVersion = `${version[0]}.${version[1]}`;
  }
  fpdf.free(versionPointer);

  const title = getMetadataTag('Title');
  if (title) {
    metadata.title = title;
  }

  const author = getMetadataTag('Author');
  if (author) {
    metadata.author = author;
  }

  const producer = getMetadataTag('Producer');
  if (producer) {
    metadata.producer = producer;
  }

  const creationDate = getMetadataTag('CreationDate');
  if (creationDate) {
    metadata.creationDate = creationDate;
  }

  const modifiedDate = getMetadataTag('ModDate');
  if (modifiedDate) {
    metadata.modifiedDate = modifiedDate;
  }

  const attachmentCount = fpdf.Doc_GetAttachmentCount(handle);
  metadata.isCollectionPresent = attachmentCount > 0;

  const formType = fpdf.GetFormType(handle);
  metadata.isAcroFormPresent = formType === FPDFFormType.ACRO_FORM;
  metadata.isXFAPresent =
    formType === FPDFFormType.XFA_FULL ||
    formType === FPDFFormType.XFA_FOREGROUND;

  return metadata;
};

const getMetadataTag = (tag: PDFiumMetadataTag): string => {
  let value = '';

  const numBytesInTag = fpdf.GetMetaText(handle, tag); // includes trailing zeros (two bytes of zeroes to indicate end of string)

  if (numBytesInTag > 2) {
    const buffer = fpdf.malloc(numBytesInTag);
    if (!buffer) {
      throw new MemoryException(
        `Array buffer allocation failed, unable to allocate memory for metadata: ${tag}`,
      );
    }
    fpdf.GetMetaText(handle, tag, buffer, numBytesInTag);
    const heapIndex = buffer / fpdf.HEAPU16.BYTES_PER_ELEMENT;
    const array = fpdf.HEAPU16.slice(
      heapIndex,
      heapIndex + (numBytesInTag - 2) / fpdf.HEAPU16.BYTES_PER_ELEMENT, // no need to send terminating characters
    );
    value = new TextDecoder('utf-16').decode(array); // buffer is encoded in UTF-16LE
    fpdf.free(buffer);
  }

  return value;
};

// #region Send To Bucket

const sendToBucket = async (fileId?: string) => {
  if (
    !shouldSendToBucketOnError ||
    process.env.NEXT_PUBLIC_IS_ELECTRON ||
    process.env.NODE_ENV === 'development' ||
    !buffer
  ) {
    return;
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  let filename;
  if (!fileId) {
    const { v4: uuid } = await import('uuid');
    filename = `${uuid()}.pdf`;
  } else {
    filename = `${fileId}.pdf`;
  }

  const data = fpdf.HEAPU8.slice(buffer.pointer, buffer.pointer + buffer.size);

  const blob = new Blob([data], { type: 'application/pdf' });

  const client = new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  const putCommand = new PutObjectCommand({
    Bucket: 'bad-pdf-compares',
    Key: filename,
    Body: blob,
  });

  await client.send(putCommand);
};
