import { Chunk, DiffLevel, Meta as Row } from 'types/normalize';
import { PDFiumChunk, BoundingBox } from 'lib/pdfium/messages';
import { Moves } from './moves';

export enum RichTextExportType {
  SplitView = 'split-view',
  LeftDocument = 'left-document',
  RightDocument = 'right-document',
  Alternating = 'alternating', // what draftable does.
}

export enum RichTextDiffType {
  Remove = 'remove',
  Insert = 'insert',
  Move = 'move',
  StyleChange = 'style',
}

export type RichTextDrawingChunk = {
  pageIndex: number;
  diffType: RichTextDiffType;
} & BoundingBox;

export interface RichTextContentDiffChunk extends PDFiumChunk {
  id: number;
  pageIndex: number;
  type: 'remove' | 'insert';
}

export interface RichTextStyleDiffChunk extends PDFiumChunk {
  id: number;
  pageIndex: number;
  type: 'equal';
  fontFamilyChanged: boolean;
  fontSizeChanged: boolean;
  colorChanged: boolean;
}

export interface RichTextMoveDiffChunk extends PDFiumChunk {
  id: number;
  pageIndex: number;
  type: 'move';
  moveId: number;
}

export type RichTextDiffChunk =
  | RichTextContentDiffChunk
  | RichTextStyleDiffChunk
  | RichTextMoveDiffChunk;

export interface RichTextDiff {
  left: RichTextDiffChunk[];
  right: RichTextDiffChunk[];
  changeLog: RichTextChangeItem[];
}

export interface RichTextWorkerInput {
  rows: Row[];
  left: PDFiumChunk[][];
  right: PDFiumChunk[][];
  diffLevel: DiffLevel;
  moves?: Moves;
}

export interface RichTextStyleChangeItem {
  chunkId: number;
  text: string;
  type: 'style';
  chunkBefore: RichTextStyleDiffChunk;
  chunkAfter: RichTextStyleDiffChunk;
}

export interface RichTextContentChangeItem {
  chunkId: number;
  text: string;
  type: 'remove' | 'insert';
}

export interface RichTextMoveChangeItem {
  chunkId: number;
  text: string;
  type: 'move';
  movedFromPage: number;
  movedToPage: number;
}

export type RichTextChangeItem =
  | RichTextStyleChangeItem
  | RichTextContentChangeItem
  | RichTextMoveChangeItem;

export type RowChunk = Omit<Chunk, 'type'> &
  (
    | {
        type: 'remove' | 'insert' | 'empty' | 'equal';
      }
    | {
        type: 'move';
        moveId: number;
      }
  );
