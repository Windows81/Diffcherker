import { DiffBlock, type Meta as Row, type UnifiedRow } from 'types/normalize';
import { CommentThread } from './comment-thread';

import { type DiffLevel } from 'types/normalize';
import { Moves } from './moves';

export type DiffUser = Readonly<{
  username: string | null;
  id: number;
}>;

export enum DiffPermission {
  VIEW = 'view',
  COMMENT = 'comment',
}

export type Diff = Readonly<{
  slug?: string;
  title?: string;
  expires?: string;
  expiry?: string;
  left?: string;
  right?: string;
  added?: number;
  removed?: number;
  userId?: number;
  user?: DiffUser; // backend returns DiffUser instead of User for diffs
  syntaxHighlight?: string;
  localTime?: string | number | Date;
  createdAt?: string;
  blocks?: DiffBlock[];
  rows?: Row[] | UnifiedRow[];
  fullyNormalized?: boolean;
  isPrivate?: boolean;
  collaborators?: string[];
  ip?: string;
  secretKey?: string;
  permission?: DiffPermission;
  diffLevel?: DiffLevel;
  commentThreads?: CommentThread[];
  openCommentThreads?: CommentThread[];
  areCommentThreadsLoaded?: boolean;
  moves?: Moves;
}>;
