// https://learn.microsoft.com/en-us/dotnet/api/microsoft.office.interop.word.wdstorytype?view=word-pia
type RevisionStoryType =
  | 'wdMainTextStory'
  | 'wdFootnotesStory'
  | 'wdEndnotesStory'
  | 'wdCommentsStory'
  | 'wdTextFrameStory'
  | 'wdEvenPagesHeaderStory'
  | 'wdPrimaryHeaderStory'
  | 'wdEvenPagesFooterStory'
  | 'wdPrimaryFooterStory'
  | 'wdFirstPageHeaderStory'
  | 'wdFirstPageFooterStory'
  | 'wdFootnoteSeparatorStory'
  | 'wdFootnoteContinuationSeparatorStory'
  | 'wdFootnoteContinuationNoticeStory'
  | 'wdEndnoteSeparatorStory'
  | 'wdEndnoteContinuationSeparatorStory'
  | 'wdEndnoteContinuationNoticeStory';

// https://learn.microsoft.com/en-us/dotnet/api/microsoft.office.interop.word.wdrevisiontype?view=word-pia
type RevisionType =
  | 'wdNoRevision'
  | 'wdRevisionInsert'
  | 'wdRevisionDelete'
  | 'wdRevisionProperty'
  | 'wdRevisionParagraphNumber'
  | 'wdRevisionDisplayField'
  | 'wdRevisionReconcile'
  | 'wdRevisionConflict'
  | 'wdRevisionStyle'
  | 'wdRevisionReplace'
  | 'wdRevisionParagraphProperty'
  | 'wdRevisionTableProperty'
  | 'wdRevisionSectionProperty'
  | 'wdRevisionStyleDefinition'
  | 'wdRevisionMovedFrom'
  | 'wdRevisionMovedTo'
  | 'wdRevisionCellInsertion'
  | 'wdRevisionCellDeletion'
  | 'wdRevisionCellMerge'
  | 'wdRevisionCellSplit'
  | 'wdRevisionConflictInsert'
  | 'wdRevisionConflictDelete';

export type RedlineRevision = {
  storyType: RevisionStoryType;
  type: RevisionType;
  rangeStartPos: string;
  rangeEndPos: string;
  date: string;
  author?: string;
  text?: string;
  isAccepted: boolean;

  /**
   * Some notes about the index:
   * - This is the revision index within the **story**, not the entire document
   * - This index may not match exactly with Word's mapping, particularly for more complicated documents.
   *   But this is okay since we use positions for scrolling in the main body.
   *   For non-main body stories (eg header/footer) we use index for scrolling, which is more reliably calculated in non-main body stories
   **/
  index: string;
};

export const parseRevisions = (rawText: string): RedlineRevision[] => {
  // TODO consider moving this logic to electron backend
  const revisions: RedlineRevision[] = [];
  const rawRevisions = rawText.split('{--DIFFCHECKER-END--}\n');
  for (const rawRevision of rawRevisions) {
    const fields = rawRevision
      .split('\r\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        return { key, value: value === '' ? undefined : value };
      });

    const rawRevisionData = fields.reduce(
      (acc, field) => {
        acc[field.key] = field.value;
        return acc;
      },
      {} as Record<string, string | undefined>,
    );

    // Initialize isAccepted to false for every revision
    const revision = {
      ...rawRevisionData,
      isAccepted: false,
    };

    if (isRevision(revision)) {
      revisions.push(revision);
    } else {
      console.error('Invalid revision:', revision);
    }
  }

  return revisions;
};

const isRevision = (obj: unknown): obj is RedlineRevision => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj !== undefined &&
    'index' in obj &&
    typeof obj.index === 'string'
  );
};

type SummarySectionStatTypes =
  | 'insert'
  | 'delete'
  | 'movesTo'
  | 'movesFrom'
  | 'unknown'
  | 'formatting'
  | 'none';

type TotalCount = {
  total: number;
};

export type RevisionSummarySectionStats = TotalCount & {
  insert: number;
  delete: number;
  movesTo: number;
  movesFrom: number;
};

export type RevisionSummarySections = {
  text: RevisionSummarySectionStats;
  headerFooter: RevisionSummarySectionStats;
  tables: RevisionSummarySectionStats;
  formatting: TotalCount;
  totals: RevisionSummarySectionStats;
};

// There is a lot of ambiguity with determining the exact type of revision
// mostly due to some kinks in our redline algorithm; I will detail my
// reasoning for categorizing some weird cases below:

// Litera can detect graphics/images. We read those as text '/', so I have
// chosen to ignore that for now.

// Litera can detect tables in header/footer. We cannot. I ignored this also.

type SummarySection = keyof RevisionSummarySections;

const storyTypeToSummarySection: Record<RevisionStoryType, SummarySection> = {
  wdMainTextStory: 'text',
  wdFootnotesStory: 'headerFooter',
  // Litera treats endnotes as text. Lets copy them!
  wdEndnotesStory: 'text',
  // Litera also treats comments as text. Although I
  // don't think we actually detect this right now.
  wdCommentsStory: 'text',
  wdTextFrameStory: 'text',
  wdEvenPagesHeaderStory: 'headerFooter',
  wdPrimaryHeaderStory: 'headerFooter',
  wdEvenPagesFooterStory: 'headerFooter',
  wdPrimaryFooterStory: 'headerFooter',
  wdFirstPageHeaderStory: 'headerFooter',
  wdFirstPageFooterStory: 'headerFooter',
  wdFootnoteSeparatorStory: 'headerFooter',
  wdFootnoteContinuationSeparatorStory: 'headerFooter',
  wdFootnoteContinuationNoticeStory: 'headerFooter',
  wdEndnoteSeparatorStory: 'text',
  wdEndnoteContinuationSeparatorStory: 'text',
  wdEndnoteContinuationNoticeStory: 'text',
};

const revisionTypeToSummaryStats: Record<
  RevisionType,
  SummarySectionStatTypes
> = {
  wdNoRevision: 'none',
  wdRevisionInsert: 'insert',
  wdRevisionDelete: 'delete',
  // Occurs when we change formatting that applies to a paragraph such as
  // alignment, spacing, etc. Inserting/deleting line numbers in a list
  // will also be detected as this. I have no clue why but the changes tab
  // treats this as a formatting change so here it is.
  // Litera just does not detect this at all.
  wdRevisionProperty: 'formatting',
  // This is what is supposed to be used for changes to list markers
  // like changing numbers to roman numerals, etc. However in those cases
  // we detect that as wdRevisionProperty for some reason.
  // Litera detects this as just inserting/deleting the list markers.
  wdRevisionParagraphNumber: 'unknown',
  // I wasn't able to replicate this.
  wdRevisionDisplayField: 'unknown',
  // I wasn't able to replicate this.
  wdRevisionReconcile: 'unknown',
  // I wasn't able to replicate this.
  wdRevisionConflict: 'unknown',
  wdRevisionStyle: 'formatting',
  // We detect all replaces with just delete/insert. Litera does too.
  wdRevisionReplace: 'unknown',
  // For consistency with our changes tab, this will be formatting
  wdRevisionParagraphProperty: 'formatting',
  // Litera does not detect this, we detect this as wdRevisionParagraphProperty
  // But the text is in the regex of a table string, so we can actually categorize
  // this as a table revision.
  wdRevisionTableProperty: 'unknown',
  // As far as I can tell, this is interchangeable with delete/insert on pages
  // with section changes, like page orientation. We ignore this in changes tab.
  wdRevisionSectionProperty: 'unknown',
  wdRevisionStyleDefinition: 'formatting',
  wdRevisionMovedFrom: 'movesFrom',
  wdRevisionMovedTo: 'movesTo',
  wdRevisionCellInsertion: 'insert',
  wdRevisionCellDeletion: 'delete',
  // We currently detect cell merges and splits as wdRevisionTableProperty
  // or wdRevisionCellInsertion/wdRevisionCellDeletion.
  wdRevisionCellMerge: 'unknown',
  wdRevisionCellSplit: 'unknown',
  wdRevisionConflictInsert: 'unknown',
  wdRevisionConflictDelete: 'unknown',
};

export const isDeleteRevision = (revision: RedlineRevision): boolean => {
  return revisionTypeToSummaryStats[revision.type] === 'delete';
};

export const isInsertRevision = (revision: RedlineRevision): boolean => {
  return revisionTypeToSummaryStats[revision.type] === 'insert';
};

export const isMoveRevision = (revision: RedlineRevision): boolean => {
  return (
    revisionTypeToSummaryStats[revision.type] === 'movesTo' ||
    revisionTypeToSummaryStats[revision.type] === 'movesFrom'
  );
};

export const isStyleRevision = (revision: RedlineRevision): boolean => {
  return revisionTypeToSummaryStats[revision.type] === 'formatting';
};

export const getRevisionSummary = (revisions: RedlineRevision[]) => {
  const stats: RevisionSummarySections = {
    text: {
      insert: 0,
      delete: 0,
      movesTo: 0,
      movesFrom: 0,
      total: 0,
    },
    headerFooter: {
      insert: 0,
      delete: 0,
      movesTo: 0,
      movesFrom: 0,
      total: 0,
    },
    tables: {
      insert: 0,
      delete: 0,
      movesTo: 0,
      movesFrom: 0,
      total: 0,
    },
    formatting: { total: 0 },
    totals: {
      insert: 0,
      delete: 0,
      movesTo: 0,
      movesFrom: 0,
      total: 0,
    },
  };

  for (const revision of revisions) {
    if (!revision.text) {
      continue;
    }

    const revisionType = revision.type;

    let section: SummarySection = storyTypeToSummarySection[revision.storyType];
    const sectionStatType: SummarySectionStatTypes =
      revisionTypeToSummaryStats[revisionType];

    if (sectionStatType === 'none' || sectionStatType === 'unknown') {
      continue;
    }

    if (isActuallyTableRevision(revision)) {
      section = 'tables';
    }

    if (sectionStatType === 'formatting') {
      stats.formatting.total++;
    } else {
      (stats[section] as RevisionSummarySectionStats)[sectionStatType]++;
      stats[section].total++;
      stats.totals[sectionStatType]++;
    }

    stats.totals.total++;
  }

  return stats;
};

const isActuallyTableRevision = (revision: RedlineRevision): boolean => {
  return /^\u0007(\n\u0007)*$/.test(revision.text || '');
};
