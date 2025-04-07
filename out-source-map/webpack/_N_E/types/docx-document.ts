export enum DocxPart {
  BODY = 'w:body',
  BREAK = 'w:br',
  DOCUMENT = 'w:document',
  ENDNOTE_REFERENCE = 'w:endnoteReference',
  ENDNOTES = 'w:endnotes',
  FALLBACK = 'mc:Fallback',
  FOOTER = 'w:ftr',
  FOOTER_REFERENCE = 'w:footerReference',
  FOOTNOTE_REFERENCE = 'w:footnoteReference',
  FOOTNOTES = 'w:footnotes',
  HEADER = 'w:hdr',
  HEADER_REFERENCE = 'w:headerReference',
  HYPERLINK = 'w:hyperlink',
  ID = 'w:id',
  INSTR_TEXT = 'w:instrText',
  PARAGRAPH = 'w:p',
  PARAGRAPH_PROPERTIES = 'w:pPr',
  REF_ID = 'r:id',
  RELATIONSHIP = 'Relationship',
  RELATIONSHIPS = 'Relationships',
  RUN = 'w:r',
  SECTION_PROPERTIES = 'w:sectPr',
  SMART_TAG = 'w:smartTag',
  TABLE = 'w:tbl',
  TABLE_CELL = 'w:tc',
  TABLE_ROW = 'w:tr',
  TAB = 'w:tab',
  TEXT = 'w:t',
  TYPE = 'w:type',
  FIELD_CHAR = 'w:fldChar',
  FIELD_CHAR_TYPE = 'w:fldCharType',
  SETTINGS = 'w:settings',
  SETTINGS_EVEN_AND_ODD_HEADERS = 'w:evenAndOddHeaders',
  SETTINGS_FIRST_PAGE_HEADER = 'w:firstPageHeader',
  APP_PROPERTIES = 'Properties',
  APP_PROPERTIES_PAGES = 'Pages',
}

export type XmlElement = {
  '#name'?: string;
  $?: { [key: string]: string }; // attributes
  $$?: XmlElement[]; // child elements
};

export interface TextElement extends XmlElement {
  _?: string;
}

export type ParseHandler = (element: XmlElement) => string | undefined;

export type HeaderFile = {
  text?: string;
  filePath?: string;
};

export type FooterFile = {
  text?: string;
  filePath?: string;
};

export type Relationship = {
  id: string;
  type: string;
  target: string;
};

export type Reference = {
  id: string;
  type: string;
  section: number;
};

export type DocxHeader = {
  id: string;
  text: string;
  type: string;
  target?: string;
  section: number;
};

export type DocxFooter = {
  id: string;
  text: string;
  type: string;
  target?: string;
  section: number;
};

export type Footnote = {
  id: string;
  text: string;
};

export type Endnote = {
  id: string;
  text: string;
};

export type Settings = {
  evenAndOddHeaders?: boolean;
};

export type DocInfo = {
  pageCount?: number;
};
