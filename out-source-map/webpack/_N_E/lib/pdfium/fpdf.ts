import ipcEvents from 'ipc-events';

export type PDFiumMetadataTag =
  | 'Title'
  | 'Author'
  | 'Subject'
  | 'Keywords'
  | 'Creator'
  | 'Producer'
  | 'CreationDate'
  | 'ModDate';

export interface FPDF {
  Init(): void;
  Destroy(): void;
  GetLastError(): number;

  LoadMemDocument(docBuffer: number, size: number, password: string): number;
  CloseDocument(docHandle: number): void;
  CreateNewDocument: () => number;
  SaveAsCopy: (
    docHandle: number,
    fileWritePtr: number,
    flags: number,
  ) => boolean;
  GetPageCount(docHandle: number): number;
  GetMetaText(
    docHandle: number,
    tag: PDFiumMetadataTag,
    buffer?: number,
    bufferLength?: number,
  ): number;
  GetFileVersion(docHandle: number, intPointer: number): boolean;
  GetFormType(docHandle: number): FPDFFormType;
  Doc_GetAttachmentCount(docHandle: number): number;

  LoadPage(docHandle: number, pageNumber: number): number;
  ClosePage(pageHandle: number): void;
  GetPageWidthF(pageHandle: number): number;
  GetPageHeightF(pageHandle: number): number;
  RenderPageBitmap(
    bitmapHandle: number,
    pageHandle: number,
    start_x: number,
    start_y: number,
    size_x: number,
    size_y: number,
    rotate: number,
    flags: number,
  ): void;
  ImportNPagesToOne: (
    srcDocHandle: number,
    outputWidth: number,
    outputHeight: number,
    numPagesOnXAxis: number,
    numPagesOnYAxis: number,
  ) => number;
  ImportPagesByIndex: (
    destDocHandle: number,
    srcDocHandle: number,
    pageIndicesPtr: number,
    length: number,
    index: number,
  ) => boolean;
  ImportPages: (
    destDocHandle: number,
    srcDocHandle: number,
    pageRangePtr: number | null,
    index: number,
  ) => boolean;

  Page_Flatten(pageHandle: number, flag: number): number;
  Page_GenerateContent(pageHandle: number): boolean;
  Page_CreateAnnot(pageHandle: number, subtype: number): number;
  Page_CloseAnnot(annotHandle: number): void;
  Page_GetAnnotCount(pageHandle: number): number;
  Page_New(
    docHandle: number,
    pageIndex: number,
    width: number,
    height: number,
  ): number;
  Page_InsertObject(pageHandle: number, objHandle: number): void;
  Page_SetMediaBox(
    pageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void;
  Page_SetCropBox(
    pageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void;
  Page_SetBleedBox(
    pageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void;
  Page_SetTrimBox(
    pageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void;
  Page_SetArtBox(
    pageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void;
  Page_CountObjects(pageHandle: number): number;
  Page_GetObject(pageHandle: number, index: number): number;

  PageObj_CreateNewPath(x: number, y: number): number;
  PageObj_CreateNewRect(
    x: number,
    y: number,
    width: number,
    height: number,
  ): number;
  PageObj_SetStrokeColor(
    objHandle: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): boolean;
  PageObj_SetStrokeWidth(objHandle: number, width: number): boolean;
  PageObj_SetFillColor(
    objHandle: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): boolean;
  PageObj_TransformF(objHandle: number, matrix: number): number;

  Path_SetDrawMode(
    objHandle: number,
    fillMode: number,
    stroke: boolean,
  ): boolean;
  Path_LineTo(objHandle: number, x: number, y: number): boolean;

  Text_LoadPage(pageHandle: number): number;
  Text_ClosePage(textPageHandle: number): void;
  Text_CountChars(textPageHandle: number): number;
  Text_GetText(
    textPageHandle: number,
    startIndex: number,
    count: number,
    result: number,
  ): number;

  Text_CountRects(
    textPageHandle: number,
    startIndex: number,
    count: number,
  ): number;
  Text_GetRect(
    textPageHandle: number,
    rectIndex: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): boolean;
  Text_GetBoundedText(
    textPageHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
    buffer?: number,
    bufferLength?: number,
  ): number;

  Text_HasUnicodeMapError(textPageHandle: number, index: number): number;
  Text_GetUnicode(textPageHandle: number, index: number): number;
  Text_GetFontSize(textPageHandle: number, index: number): number;
  Text_GetFontInfo(
    textPageHandle: number,
    index: number,
    buffer?: number,
    bufferLength?: number,
    flagPointer?: number,
  ): number;
  Text_GetFontWeight(textPageHandle: number, index: number): number;
  Text_GetTextRenderMode(textPageHandle: number, index: number): number;
  Text_GetFillColor(
    textPageHandle: number,
    index: number,
    redPointer: number,
    greenPointer: number,
    bluePointer: number,
    alphaPointer: number,
  ): boolean;
  Text_GetStrokeColor(
    textPageHandle: number,
    index: number,
    redPointer: number,
    greenPointer: number,
    bluePointer: number,
    alphaPointer: number,
  ): boolean;
  Text_GetCharBox(
    textPageHandle: number,
    index: number,
    leftPointer: number,
    rightPointer: number,
    bottomPointer: number,
    topPointer: number,
  ): boolean;
  Text_GetLooseCharBox(
    textPageHandle: number,
    index: number,
    rectPointer: number,
  ): boolean;
  Text_GetMatrix(
    textPageHandle: number,
    index: number,
    matrixPointer: number,
  ): boolean;
  Text_GetCharOrigin(
    textPageHandle: number,
    index: number,
    xPointer: number,
    yPointer: number,
  ): boolean;

  Bitmap_Create(width: number, height: number, alpha: number): number;
  Bitmap_Destroy(bitmapHandle: number): void;
  Bitmap_GetBuffer(bitmapHandle: number): number;
  Bitmap_FillRect(
    bitmapHandle: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
    color: number,
  ): void;

  Annot_SetColor(
    annotHandle: number,
    colorType: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): boolean;
  Annot_AppendAttachmentPoints(
    annotHandle: number,
    quadPointsHandle: number,
  ): boolean;
  Annot_SetFlags(annotHandle: number, flags: number): boolean;
  Annot_SetRect(annotHandle: number, rectPointer: number): boolean;
  Annot_SetBorder(
    annotHandle: number,
    horizontalRadius: number,
    verticalRadius: number,
    borderWidth: number,
  ): boolean;

  malloc: (size: number) => number;
  free: (pointer: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addFunction: (func: (...args: any) => unknown, sig: string) => number;
  removeFunction: (pointer: number) => void;

  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;
}

export const getFPDFPath = async (): Promise<string> => {
  let base = '/';
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_IS_ELECTRON) {
    const appPath = await window.ipcRenderer.invoke(ipcEvents.APP__GET_PATH);
    base = `file:///${appPath}/${window.electronIsDev ? 'web' : 'out'}/`;
  }
  base += 'static/pdfium-6662/';
  return base;
};

export const getFPDF = async (filePath: string): Promise<FPDF> => {
  const moduleImport = await import('./6662/pdfium');

  return wrapFPDF(
    await moduleImport.default({
      locateFile: (path: string) => filePath + path,
    }),
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrapFPDF = (Module: any): FPDF => ({
  Init: Module.cwrap('PDFium_Init'),
  Destroy: Module.cwrap('FPDF_DestroyLibrary'),
  GetLastError: Module.cwrap('FPDF_GetLastError', 'number'),

  LoadMemDocument: Module.cwrap('FPDF_LoadMemDocument', 'number', [
    'number',
    'number',
    'string',
  ]),
  CloseDocument: Module.cwrap('FPDF_CloseDocument', null, ['number']),
  CreateNewDocument: Module.cwrap('FPDF_CreateNewDocument', 'number', []),
  SaveAsCopy: Module.cwrap('FPDF_SaveAsCopy', 'boolean', [
    'number',
    'number',
    'number',
  ]),
  GetPageCount: Module.cwrap('FPDF_GetPageCount', 'number', ['number']),
  GetFileVersion: Module.cwrap('FPDF_GetFileVersion', 'boolean', [
    'number',
    'number',
  ]),
  GetMetaText: Module.cwrap('FPDF_GetMetaText', 'number', [
    'number',
    'string',
    'number',
    'number',
  ]),
  GetFormType: Module.cwrap('FPDF_GetFormType', 'number', ['number']),
  Doc_GetAttachmentCount: Module.cwrap('FPDFDoc_GetAttachmentCount', 'number', [
    'number',
  ]),

  LoadPage: Module.cwrap('FPDF_LoadPage', 'number', ['number', 'number']),
  ClosePage: Module.cwrap('FPDF_ClosePage', null, ['number']),
  GetPageWidthF: Module.cwrap('FPDF_GetPageWidthF', 'number', ['number']),
  GetPageHeightF: Module.cwrap('FPDF_GetPageHeightF', 'number', ['number']),
  RenderPageBitmap: Module.cwrap('FPDF_RenderPageBitmap', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  ImportNPagesToOne: Module.cwrap('FPDF_ImportNPagesToOne', 'number', [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  ImportPagesByIndex: Module.cwrap('FPDF_ImportPagesByIndex', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  ImportPages: Module.cwrap('FPDF_ImportPages', 'boolean', [
    'number',
    'number',
    'number',
    'number',
  ]),

  Page_Flatten: Module.cwrap('FPDFPage_Flatten', 'number', [
    'number',
    'number',
  ]),
  Page_GenerateContent: Module.cwrap('FPDFPage_GenerateContent', 'boolean', [
    'number',
  ]),
  Page_CreateAnnot: Module.cwrap('FPDFPage_CreateAnnot', 'number', [
    'number',
    'number',
  ]),
  Page_CloseAnnot: Module.cwrap('FPDFPage_CloseAnnot', null, ['number']),
  Page_GetAnnotCount: Module.cwrap('FPDFPage_GetAnnotCount', 'number', [
    'number',
  ]),
  Page_New: Module.cwrap('FPDFPage_New', 'number', [
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_InsertObject: Module.cwrap('FPDFPage_InsertObject', null, [
    'number',
    'number',
  ]),
  Page_SetMediaBox: Module.cwrap('FPDFPage_SetMediaBox', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_SetCropBox: Module.cwrap('FPDFPage_SetCropBox', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_SetBleedBox: Module.cwrap('FPDFPage_SetBleedBox', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_SetTrimBox: Module.cwrap('FPDFPage_SetTrimBox', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_SetArtBox: Module.cwrap('FPDFPage_SetArtBox', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Page_CountObjects: Module.cwrap('FPDFPage_CountObjects', 'number', [
    'number',
  ]),
  Page_GetObject: Module.cwrap('FPDFPage_GetObject', 'number', 'number'),

  PageObj_CreateNewPath: Module.cwrap('FPDFPageObj_CreateNewPath', 'number', [
    'number',
    'number',
  ]),
  PageObj_CreateNewRect: Module.cwrap('FPDFPageObj_CreateNewRect', 'number', [
    'number',
    'number',
    'number',
    'number',
  ]),
  PageObj_SetStrokeColor: Module.cwrap(
    'FPDFPageObj_SetStrokeColor',
    'boolean',
    ['number', 'number', 'number', 'number', 'number'],
  ),
  PageObj_SetStrokeWidth: Module.cwrap(
    'FPDFPageObj_SetStrokeWidth',
    'boolean',
    ['number', 'number'],
  ),
  PageObj_SetFillColor: Module.cwrap('FPDFPageObj_SetFillColor', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  PageObj_TransformF: Module.cwrap(
    'FPDFPageObj_TransformF',
    'number',
    'number',
  ),

  Path_SetDrawMode: Module.cwrap('FPDFPath_SetDrawMode', 'boolean', [
    'number',
    'number',
    'boolean',
  ]),
  Path_LineTo: Module.cwrap('FPDFPath_LineTo', 'boolean', [
    'number',
    'number',
    'number',
  ]),

  Text_LoadPage: Module.cwrap('FPDFText_LoadPage', 'number', ['number']),
  Text_ClosePage: Module.cwrap('FPDFText_ClosePage', null, ['number']),
  Text_CountChars: Module.cwrap('FPDFText_CountChars', 'number', ['number']),
  Text_GetText: Module.cwrap('FPDFText_GetText', 'number', [
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_CountRects: Module.cwrap('FPDFText_CountRects', 'number', [
    'number',
    'number',
    'number',
  ]),
  Text_GetRect: Module.cwrap('FPDFText_GetRect', 'number', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_GetBoundedText: Module.cwrap('FPDFText_GetBoundedText', 'number', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),

  Text_HasUnicodeMapError: Module.cwrap(
    'FPDFText_HasUnicodeMapError',
    'number',
    ['number', 'number'],
  ),
  Text_GetUnicode: Module.cwrap('FPDFText_GetUnicode', 'number', [
    'number',
    'number',
  ]),
  Text_GetFontSize: Module.cwrap('FPDFText_GetFontSize', 'number', [
    'number',
    'number',
  ]),
  Text_GetFontInfo: Module.cwrap('FPDFText_GetFontInfo', 'number', [
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_GetFontWeight: Module.cwrap('FPDFText_GetFontWeight', 'number', [
    'number',
    'number',
  ]),
  Text_GetTextRenderMode: Module.cwrap('FPDFText_GetTextRenderMode', 'number', [
    'number',
    'number',
  ]),
  Text_GetFillColor: Module.cwrap('FPDFText_GetFillColor', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_GetStrokeColor: Module.cwrap('FPDFText_GetStrokeColor', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_GetCharBox: Module.cwrap('FPDFText_GetCharBox', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Text_GetLooseCharBox: Module.cwrap('FPDFText_GetLooseCharBox', 'boolean', [
    'number',
    'number',
    'number',
  ]),
  Text_GetMatrix: Module.cwrap('FPDFText_GetMatrix', 'boolean', [
    'number',
    'number',
    'number',
  ]),
  Text_GetCharOrigin: Module.cwrap('FPDFText_GetCharOrigin', 'boolean', [
    'number',
    'number',
    'number',
    'number',
  ]),

  Bitmap_Create: Module.cwrap('FPDFBitmap_Create', 'number', [
    'number',
    'number',
    'number',
  ]),
  Bitmap_Destroy: Module.cwrap('FPDFBitmap_Destroy', null, ['number']),
  Bitmap_GetBuffer: Module.cwrap('FPDFBitmap_GetBuffer', 'number', ['number']),
  Bitmap_FillRect: Module.cwrap('FPDFBitmap_FillRect', null, [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),

  Annot_SetColor: Module.cwrap('FPDFAnnot_SetColor', 'boolean', [
    'number',
    'number',
    'number',
    'number',
    'number',
    'number',
  ]),
  Annot_AppendAttachmentPoints: Module.cwrap(
    'FPDFAnnot_AppendAttachmentPoints',
    'boolean',
    ['number', 'number'],
  ),
  Annot_SetFlags: Module.cwrap('FPDFAnnot_SetFlags', 'boolean', [
    'number',
    'number',
  ]),
  Annot_SetRect: Module.cwrap('FPDFAnnot_SetRect', 'boolean', [
    'number',
    'number',
  ]),
  Annot_SetBorder: Module.cwrap('FPDFAnnot_SetBorder', 'boolean', [
    'number',
    'number',
    'number',
    'number',
  ]),

  malloc: Module.wasmExports.malloc,
  free: Module.wasmExports.free,
  addFunction: Module.addFunction,
  removeFunction: Module.removeFunction,

  get HEAP8() {
    return Module.HEAP8;
  },
  get HEAP16() {
    return Module.HEAP16;
  },
  get HEAP32() {
    return Module.HEAP32;
  },
  get HEAPU8() {
    return Module.HEAPU8;
  },
  get HEAPU16() {
    return Module.HEAPU16;
  },
  get HEAPU32() {
    return Module.HEAPU32;
  },
  get HEAPF32() {
    return Module.HEAPF32;
  },
  get HEAPF64() {
    return Module.HEAPF64;
  },
});

export enum FPDFError {
  SUCCESS = 0, // No error.
  UNKNOWN = 1, // Unknown error.
  FILE = 2, // File not found or could not be opened.
  FORMAT = 3, // File not in PDF format or corrupted.
  PASSWORD = 4, // Password required or incorrect password.
  SECURITY = 5, // Unsupported security scheme.
  PAGE = 6, // Page not found or content error.
}

export enum FPDFRenderFlag {
  REVERSE_BYTE_ORDER = 0x10,
}

export enum FPDFFormType {
  NONE = 0, // Document contains no forms
  ACRO_FORM = 1, // Forms are specified using AcroForm spec
  XFA_FULL = 2, // Forms are specified using entire XFA spec
  XFA_FOREGROUND = 3, // Forms are specified using the XFAF subset of XFA spec
}

export enum FPDFTextRenderMode {
  UNKNOWN = -1,
  FILL = 0,
  STROKE = 1,
  FILL_STROKE = 2,
  INVISIBLE = 3,
  FILL_CLIP = 4,
  STROKE_CLIP = 5,
  FILL_STROKE_CLIP = 6,
  CLIP = 7,
}
