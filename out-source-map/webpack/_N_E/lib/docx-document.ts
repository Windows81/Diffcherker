import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

import {
  DocxFooter,
  DocxHeader,
  DocxPart,
  Endnote,
  Settings,
  DocInfo,
  FooterFile,
  Footnote,
  HeaderFile,
  ParseHandler,
  Reference,
  Relationship,
  TextElement,
  XmlElement,
} from 'types/docx-document';

import path from 'pathe';
import {
  toIntegerSuperscript,
  toRomanNumeralSuperscript,
} from './to-superscript';

export class DocxDocumentFactory {
  static async create(docxData: ArrayBuffer): Promise<DocxDocument> {
    const zip = await new JSZip().loadAsync(docxData);
    return new DocxDocument(zip);
  }
}

export class DocxDocument {
  private static readonly ignoreElements = new Set<string>([DocxPart.FALLBACK]);
  private zip: JSZip;
  private xmlElementHandlers: Map<string, ParseHandler>;
  private bodyText?: string;
  private headerFiles: HeaderFile[] = [];
  private footerFiles: FooterFile[] = [];
  private relationships: Relationship[] = [];
  private headerReferences: Reference[] = [];
  private footerReferences: Reference[] = [];
  private footnotes: Footnote[] = [];
  private endnotes: Endnote[] = [];
  private settings?: Settings;
  private docInfo?: DocInfo;

  private sections = 0;
  private parsingState = {
    insideHeader: false,
    insideFooter: false,
    insideFieldCharacter: false,
    insideFieldCharacterSeparate: false,
    insidePageFieldCharacter: false,
  };

  constructor(zip: JSZip) {
    this.zip = zip;
    this.xmlElementHandlers = new Map([
      [DocxPart.PARAGRAPH, this.parseParagraph],
      [DocxPart.PARAGRAPH_PROPERTIES, this.parseParagraphProperties],
      [DocxPart.TEXT, this.parseText],
      [DocxPart.INSTR_TEXT, this.parseInstrText],
      [DocxPart.TABLE, this.parseTable],
      [DocxPart.TABLE_ROW, this.parseTableRow],
      [DocxPart.TABLE_CELL, this.parseTableCell],
      [DocxPart.TAB, this.parseTab],
      [DocxPart.BREAK, this.parseBreak],
      [DocxPart.SECTION_PROPERTIES, this.parseSectionProperties],
      [DocxPart.HEADER_REFERENCE, this.parseHeaderReference],
      [DocxPart.FOOTER_REFERENCE, this.parseFooterReference],
      [DocxPart.FOOTNOTE_REFERENCE, this.parseFootnoteReference],
      [DocxPart.ENDNOTE_REFERENCE, this.parseEndnoteReference],
      [DocxPart.RELATIONSHIP, this.parseRelationship],
      [DocxPart.FIELD_CHAR, this.parseFieldCharacter],
    ]);
  }

  async getBodyText() {
    if (this.bodyText) {
      return this.bodyText;
    }
    this.sections = 0;
    const xml = await this.readXmlFile('word/document.xml');
    const bodyText = this.parseXmlElement(xml[DocxPart.DOCUMENT]) ?? '';
    this.bodyText = bodyText;
    return bodyText;
  }

  async getDocInfo(): Promise<DocInfo | undefined> {
    if (this.docInfo) {
      return this.docInfo;
    }
    try {
      const xml = await this.readXmlFile('docProps/app.xml');
      return xml[DocxPart.APP_PROPERTIES]?.$$?.reduce(
        (docInfoObj: DocInfo, appPropertiesElement: XmlElement) => {
          let pageCount = docInfoObj.pageCount;
          if (appPropertiesElement['#name'] === DocxPart.APP_PROPERTIES_PAGES) {
            const text = this.parseText(appPropertiesElement);
            if (text) {
              pageCount = parseInt(text);
            }
          }
          docInfoObj.pageCount = pageCount;
          return docInfoObj;
        },
        { pageCount: Number.MAX_VALUE },
      );
    } catch (err) {
      console.debug('No doc info could be retrieved', err);
      return undefined;
    }
  }

  async getSettings(): Promise<Settings | undefined> {
    if (this.settings) {
      return this.settings;
    }
    try {
      const xml = await this.readXmlFile('word/settings.xml');
      return xml[DocxPart.SETTINGS]?.$$?.reduce(
        (settingsObj: Settings, settingsElement: XmlElement) => {
          if (
            settingsElement['#name'] === DocxPart.SETTINGS_EVEN_AND_ODD_HEADERS
          ) {
            settingsObj.evenAndOddHeaders = true;
          }

          return settingsObj;
        },
        { evenAndOddHeaders: false },
      );
    } catch (e) {
      console.debug('No settings could be retrieved', e);
      return undefined;
    }
  }

  async getFootnotes(): Promise<Footnote[]> {
    if (this.footnotes?.length > 0) {
      return this.footnotes;
    }
    try {
      const xml = await this.readXmlFile('word/footnotes.xml');
      this.footnotes = xml[DocxPart.FOOTNOTES]?.$$?.map(
        (footnoteElement: XmlElement) => {
          const { [DocxPart.ID]: id } = footnoteElement.$ ?? {};
          const text = this.parseXmlElement(footnoteElement) ?? '';
          if (!text) {
            return;
          }
          return { id, text: `${toIntegerSuperscript(parseInt(id))}${text}` };
        },
      ).filter((footnote: Footnote) => footnote !== undefined);
      return this.footnotes;
    } catch (e) {
      console.debug('No footnotes could be retrieved', e);
      return [];
    }
  }

  async getEndnotes(): Promise<Endnote[]> {
    if (this.endnotes?.length > 0) {
      return this.endnotes;
    }
    try {
      const xml = await this.readXmlFile('word/endnotes.xml');
      this.endnotes = xml[DocxPart.ENDNOTES]?.$$?.map(
        (endnoteElement: XmlElement) => {
          const { [DocxPart.ID]: id } = endnoteElement.$ ?? {};
          const text = this.parseXmlElement(endnoteElement);
          if (!text) {
            return;
          }
          return {
            id,
            text: `${toRomanNumeralSuperscript(parseInt(id))}${text}`,
          };
        },
      ).filter((footnote: Footnote) => footnote !== undefined);
      return this.endnotes;
    } catch (e) {
      console.debug('No endnotes could be retrieved', e);
      return [];
    }
  }

  async getHeaders(): Promise<DocxHeader[]> {
    try {
      return Promise.all(
        (await this.getHeaderReferences()).map(async (ref) => {
          const { id, type, section } = ref;
          const { target } =
            (await this.getRelationships()).find(
              (relationship) => relationship.id === id,
            ) ?? {};
          const { text } =
            (await this.parseHeaderFiles()).find(
              (headerFile) =>
                path.basename(headerFile.filePath ?? '') === target,
            ) ?? {};
          return { id, text: text ?? '', type, target, section };
        }),
      );
    } catch (e) {
      console.debug('No headers could be retrieved', e);
      return [];
    }
  }

  async getFooters(): Promise<DocxFooter[]> {
    try {
      return Promise.all(
        (await this.getFooterReferences()).map(async (ref) => {
          const { id, type, section } = ref;
          const { target } =
            (await this.getRelationships()).find(
              (relationship) => relationship.id === id,
            ) ?? {};
          const { text } =
            (await this.parseFooterFiles()).find(
              (footerFile) =>
                path.basename(footerFile.filePath ?? '') === target,
            ) ?? {};
          return { id, text: text ?? '', type, target, section };
        }),
      );
    } catch (e) {
      console.debug('No headers could be retrieved', e);
      return [];
    }
  }

  private async parseHeaderFiles() {
    if (this.headerFiles?.length > 0) {
      return this.headerFiles;
    }
    const headerFiles = Object.keys(this.zip.files).filter((filePath) =>
      filePath.includes('header'),
    );
    this.headerFiles = await Promise.all(
      headerFiles.map(async (filePath): Promise<HeaderFile> => {
        const xml = await this.readXmlFile(filePath);
        this.parsingState.insideHeader = true;
        const text = this.parseXmlElement(xml[DocxPart.HEADER]);
        this.parsingState.insideHeader = false;
        return { text, filePath };
      }),
    );
    return this.headerFiles;
  }

  private async parseFooterFiles() {
    if (this.footerFiles?.length > 0) {
      return this.footerFiles;
    }
    const footerFiles = Object.keys(this.zip.files).filter((filePath) =>
      filePath.includes('footer'),
    );
    this.footerFiles = await Promise.all(
      footerFiles.map(async (filePath): Promise<FooterFile> => {
        const xml = await this.readXmlFile(filePath);
        this.parsingState.insideFooter = true;
        const text = this.parseXmlElement(xml[DocxPart.FOOTER]);
        this.parsingState.insideFooter = false;
        return { text, filePath };
      }),
    );
    return this.footerFiles;
  }

  private async getHeaderReferences() {
    if (this.headerReferences?.length > 0) {
      return this.headerReferences;
    }
    await this.getBodyText(); // Ensure body text is loaded - header references are in the body
    return this.headerReferences;
  }

  private async getFooterReferences() {
    if (this.footerReferences?.length > 0) {
      return this.footerReferences;
    }
    await this.getBodyText(); // Ensure body text is loaded - footer references are in the body
    return this.footerReferences;
  }

  private async getRelationships() {
    const xml = await this.readXmlFile('word/_rels/document.xml.rels');
    this.parseXmlElement(xml.Relationships); // this.relationships will be populated during parsing
    return this.relationships;
  }

  private async readXmlFile(filePath: string) {
    const xmlString = await this.zip.file(filePath)?.async('string');
    if (!xmlString) {
      throw new Error(`Unable to read xml file: ${filePath}`);
    }
    const xmlObject = await parseStringPromise(xmlString, {
      explicitChildren: true,
      preserveChildrenOrder: true,
      charsAsChildren: true,
      normalize: false,
      normalizeTags: false,
      includeWhiteChars: true,
    });
    return xmlObject;
  }

  parseXmlElement = (element: XmlElement): string | undefined => {
    if (
      element === undefined ||
      element['#name'] === undefined ||
      DocxDocument.ignoreElements.has(element['#name'])
    ) {
      return;
    }

    const handler = this.xmlElementHandlers.get(element['#name']);
    if (handler) {
      return handler(element);
    } else {
      const containsParagraph = element.$$?.some(
        (e) => e['#name'] === DocxPart.PARAGRAPH,
      );
      return this.defaultParseHandler(element, containsParagraph ? '\n' : '');
    }
  };

  defaultParseHandler = (
    element: XmlElement,
    delimeter: string,
    emptyTextValue?: string,
  ) => {
    const elementsText = element.$$?.map(
      this.parseXmlElement.bind(this),
    ).filter((e) => e !== undefined);
    if (!elementsText || elementsText?.length === 0) {
      return emptyTextValue;
    }
    return elementsText.join(delimeter);
  };

  parseParagraphProperties = (paragraphPropertiesElement: XmlElement) => {
    const delimeter = '';
    this.defaultParseHandler(paragraphPropertiesElement, delimeter);
    return undefined;
  };

  parseParagraph = (paragraphElement: XmlElement) => {
    const delimeter = '';
    const emptyTextValue = ''; // replace empty paragraphs with empty string
    const res = this.defaultParseHandler(
      paragraphElement,
      delimeter,
      emptyTextValue,
    );
    return res;
  };

  parseText = (textElement: XmlElement) => {
    if (textElement.$$ === undefined) {
      return (textElement as TextElement)._ ?? '';
    }

    /**
     * This is the key to preventing random numbers showing up along side our `<Page #>` output
     * in our headers/footers. The page number is broken up into a functional portion,
     * and a cached value portion, which is stored between `separate` and `end` delimeters
     *
     * <...>
     *  <w:fldChar w:fldCharType="begin"/>
     * <.../>
     * <...>
     *     <w:instrText xml:space="preserve"> PAGE  </w:instrText>
     * <...>
     *  <w:fldChar w:fldCharType="separate"/>
     * <.../>
     * <...>
     *     <w:t>12</w:t>
     * <...>
     * <...>
     *  <w:fldChar w:fldCharType="end"/>
     * <.../>
     *
     * Cached values
     */
    if (
      this.parsingState.insidePageFieldCharacter &&
      this.parsingState.insideFieldCharacterSeparate
    ) {
      return '';
    }

    const text = textElement.$$.filter((e) => e['#name'] === '__text__')
      .map((e) => (e as TextElement)._ ?? '')
      .join('');
    return text;
  };

  parseInstrText = (instrTextElement: XmlElement) => {
    const text = this.parseText(instrTextElement);
    const insideHeaderFooter =
      this.parsingState.insideHeader || this.parsingState.insideFooter;
    if (text.includes('PAGE') && insideHeaderFooter) {
      if (this.parsingState.insideFieldCharacter) {
        this.parsingState.insidePageFieldCharacter = true;
      }

      return '<Page #>';
    }
    return undefined;
  };

  parseTab = (_tabElement: XmlElement) => {
    return '\t';
  };

  parseBreak = (breakElement: XmlElement) => {
    const type = breakElement.$?.[DocxPart.TYPE];
    if (type === 'page') {
      return '';
    }

    // Return a newline for all other break types
    return '\n';
  };

  parseTable = (tableElement: XmlElement) => {
    const delimeter = '\n';
    return this.defaultParseHandler(tableElement, delimeter);
  };

  parseTableRow = (rowElement: XmlElement) => {
    const delimeter = '\t';
    return this.defaultParseHandler(rowElement, delimeter);
  };

  parseTableCell = (cellElement: XmlElement) => {
    const delimeter = '\n';
    return this.defaultParseHandler(cellElement, delimeter);
  };

  parseSectionProperties = (sectionPropertiesElement: XmlElement) => {
    const delimeter = '';
    this.sections++;
    this.defaultParseHandler(sectionPropertiesElement, delimeter);
    return undefined;
  };

  parseHeaderReference = (headerReferenceElement: XmlElement) => {
    const { [DocxPart.TYPE]: type, [DocxPart.REF_ID]: id } =
      headerReferenceElement.$ ?? {};
    if (!type || !id) {
      throw new Error('Header reference element missing required attributes');
    }
    this.headerReferences.push({ type, id, section: this.sections });
    return undefined;
  };

  parseFooterReference = (footerReferenceElement: XmlElement) => {
    const { [DocxPart.TYPE]: type, [DocxPart.REF_ID]: id } =
      footerReferenceElement.$ ?? {};
    if (!type || !id) {
      throw new Error('Footer reference element missing required attributes');
    }
    this.footerReferences.push({ type, id, section: this.sections });
    return undefined;
  };

  parseFootnoteReference = (footnoteReferenceElement: XmlElement) => {
    const { [DocxPart.ID]: id } = footnoteReferenceElement.$ ?? {};
    return toIntegerSuperscript(parseInt(id));
  };

  parseEndnoteReference = (endnoteReferenceElement: XmlElement) => {
    const { [DocxPart.ID]: id } = endnoteReferenceElement.$ ?? {};
    return toRomanNumeralSuperscript(parseInt(id));
  };

  parseRelationships = (relationshipsElement: XmlElement) => {
    const delimeter = '';
    this.defaultParseHandler(relationshipsElement, delimeter);
    return undefined;
  };

  parseRelationship = (relationshipElement: XmlElement) => {
    const { Id, Type, Target } = relationshipElement.$ ?? {};
    if (!Id || !Type || !Target) {
      throw new Error('Relationship element missing required attributes');
    }
    this.relationships.push({
      id: Id,
      type: Type,
      target: Target,
    });
    return undefined;
  };

  parseFieldCharacter = (styleElement: XmlElement) => {
    const { [DocxPart.FIELD_CHAR_TYPE]: type } = styleElement.$ ?? {};

    if (type === 'begin') {
      this.parsingState.insideFieldCharacter = true;
      this.parsingState.insideFieldCharacterSeparate = false;
    } else if (type === 'separate') {
      this.parsingState.insideFieldCharacterSeparate = true;
    } else {
      // 'end'
      this.parsingState.insideFieldCharacter = false;
      this.parsingState.insideFieldCharacterSeparate = false;
      this.parsingState.insidePageFieldCharacter = false;
    }

    const delimeter = '';
    return this.defaultParseHandler(styleElement, delimeter);
  };
}
