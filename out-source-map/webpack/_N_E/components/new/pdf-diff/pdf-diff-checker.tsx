import cx from 'classnames';
import PdfInput from './pdf-input/pdf-input';
import usePdfDocument, { PdfDocumentState } from 'lib/hooks/use-diff-document';
import css from './pdf-diff-checker.module.css';
import { RecordingInfo } from 'types/recordingInfo';
import DetailsSvg from 'components/shared/icons/details.svg';
import DifferenceSvg from 'components/shared/icons/difference.svg';
import DocumentSvg from 'components/shared/icons/document.svg';
import FadeSvg from 'components/shared/icons/fade.svg';
import HighlightSvg from 'components/shared/icons/highlight.svg';
import PagesEvenSvg from 'components/shared/icons/pages-even.svg';
import PagesFirst from 'components/shared/icons/pages-first.svg';
import PagesOddSvg from 'components/shared/icons/pages-odd.svg';
import SliderSvg from 'components/shared/icons/slider.svg';
import SplitSvg from 'components/shared/icons/split.svg';
import TextSvg from 'components/shared/icons/text.svg';
import LoadingCircle from 'components/shared/loaders/loading-circle';
import ipcEvents from 'ipc-events';
import cloneArrayBuffer from 'lib/clone-array-buffer';
import comparePdfImages, {
  type PdfImageDiffResult,
} from 'lib/compare-pdf-images';
import convertToPdf from 'lib/convert/pdf/convert-to-pdf';
import { useWorker, UseWorkerCall } from 'lib/hooks/use-worker';
import {
  NewOutputType,
  PdfDiffOutputTypes,
  PdfImageDiffOutputTypes,
} from 'lib/output-types';
import PDFium from 'lib/pdfium';
import PDFiumDocument, { PDFiumDocumentContent } from 'lib/pdfium/document';
import { PDFiumMetadataResponse } from 'lib/pdfium/messages';
import { t } from 'lib/react-tiny-i18n';
import { checkRedlinePrerequisites, redlineWord } from 'lib/redline/redline';
import Tracking from 'lib/tracking';
import { captureException } from 'lib/sentry';
import { v4 as uuid } from 'uuid';
import {
  FC,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DraggableData } from 'react-draggable';
import { Diff } from 'types/diff';
import { DiffInputType } from 'types/diff-input-type';
import { ImageEvent, type ImageState } from 'types/image-diff';
import { type DiffLevel } from 'types/normalize';
import { type Option } from 'types/option';
import { PdfConversionResult } from 'types/pdf-conversion';
import { WordDocumentInfo } from 'types/word-doc-info';
import DiffOutputTypeSwitch from '../diff-output-type-switch';
import { TextDiffOutputApi, nullApi } from '../text-diff-output/context';
import {
  TextDiffOutputSettingsObject,
  defaultTextDiffOutputSettings,
} from '../text-diff-output/settings';
import {
  RedlineOutputSettingsObject,
  defaultRedlineOutputSettings,
} from '../redline-output/settings';

import capitalize from 'lib/capitalize';
import computeEndnotesDiff from './commands/compute-endnotes-diff';
import computeFooterDiffs, {
  FooterDiff,
} from './commands/compute-footer-diffs';
import computeFootnotesDiff from './commands/compute-footnotes-diff';
import computeHeaderDiffs, {
  HeaderDiff,
} from './commands/compute-header-diffs';
import pdfOutputSharedCss from './pdf-output/pdf-output-shared.module.css';
import getOs from 'lib/get-os';
import PlainTextOutputContainer from './pdf-output/pdf-plain-text';
import ImageOutputContainer from './pdf-output/pdf-image';
import OCRTextOutputContainer from './pdf-output/pdf-ocr-text';
import FileDetailsOutputContainer from './pdf-output/file-details-output-container';
import RichTextOutputContainer from './pdf-output/pdf-rich-text';
import { RichTextDiff } from 'types/rich-text';
import getRichTextDiff from 'lib/rich-text/get-rich-text-diff';
import convertChunksToLines from 'lib/rich-text/convert-chunks-to-lines';
import stringToDocx from 'web/string-to-docx';
import {
  parseRevisions,
  getRevisionSummary,
  RedlineRevision,
  RevisionSummarySections,
} from 'lib/redline/get-revisions';
import { useProfiles, Profile } from 'lib/state/profiles';
import { FileInfo } from 'types/file-info';
import { RedlineViewType } from 'types/redline-view-type';
import { ZoomTypeOption } from 'types/zoom-type-option';
import { RedlineErrorMessages } from 'lib/redline/redline-error-messages';
import { calculateHash } from 'lib/calculate-buffer-hash';
import { NormalizeDiffInput } from 'lib/workers/normalize-worker';
import { WorkerMessageDataTypes } from 'lib/workers';
import MessageBanner from 'components/shared/message-banner';
import { devLog } from 'lib/logger';
import {
  isDeleteRevision,
  isInsertRevision,
  isMoveRevision,
  isStyleRevision,
} from 'lib/redline/get-revisions';
import Button from 'components/shared/button';
import PdfMetadata from './pdf-metadata';
import sharedCss from './pdf-output/pdf-output-shared.module.css';
import RedlineOutputContainer from './pdf-output/pdf-redline';
import { ElectronErrorInfo, ElectronError } from 'types/electron-error';
import { checkIfShouldPrintOut } from 'lib/check-microsoft-print-out';

interface PdfDiffCheckerProps {
  initialLeftPath?: string;
  initialRightPath?: string;
  recordingInfo?: RecordingInfo;
  hideAds?: () => void;
  diffOrigin?: string;
}

type RichTextDiffState = {
  richTextDiffData: RichTextDiff | undefined;
  richTextLoading: boolean;
  richTextDiffLevel: DiffLevel;
  richTextShowMoves: boolean;
  richTextExporting: boolean;
};

type TextDiffState = {
  textDiffData: Diff | undefined;
  headersDiffData: HeaderDiff[];
  footersDiffData: FooterDiff[];
  footnotesDiffData: Diff | undefined;
  endnotesDiffData: Diff | undefined;
  docxContentTypeView: DocxContentTypeView;
  textDiffLevel: DiffLevel;
};

type ImageDiffState = {
  imageDiffData: PdfImageDiffResult[] | undefined;
  imageLoading: boolean;
};

type OcrDiffState = {
  ocrDiffData: Diff | undefined;
  ocrLoading: boolean;
  ocrProgress: number;
  ocrDiffLevel: DiffLevel;
};

type MetadataDiffState = {
  leftMetadata: PDFiumMetadataResponse | undefined;
  rightMetadata: PDFiumMetadataResponse | undefined;
  metadataLoading: boolean;
};

type RedlineDiffState = {
  redlineOutputSettings: RedlineOutputSettingsObject;
  redlineLoading: boolean;
  redlineError: string | undefined;
  redlinePdf: PdfConversionResult | undefined;
  redlineWordDoc: WordDocumentInfo | undefined;
  redlinePDFiumContent: PDFiumDocumentContent | undefined;
  redlineRevisions: RedlineRevision[];
  selectedRedlineRevision: RedlineRevision | null;
  redlineRevisionError: string | undefined;
  redlineRevisionsLoading: boolean;
  isExportingAcceptedRevisions: boolean;
  redlineViewType: RedlineViewType;
  redlineZoomType: ZoomTypeOption;
  redlinePDFiumDocId: number | undefined;
  redlineRevisionSummary: RevisionSummarySections | undefined;
  redlineDiffedAt: Date | undefined;
};

const REDLINE_DEFAULT_VIEW_TYPE: RedlineViewType = RedlineViewType.REDLINE;
const REDLINE_DEFAULT_ZOOM_TYPE: ZoomTypeOption = {
  label: 'Automatic Zoom',
  value: 'auto',
};

export type RedlineOversizedPages = {
  left: number[];
  right: number[];
};

export type DocxContentTypeView =
  | 'content'
  | 'header'
  | 'footer'
  | 'footnotes'
  | 'endnotes';

const outputTypes: NewOutputType<PdfDiffOutputTypes>[] = [
  { icon: DocumentSvg, name: PdfDiffOutputTypes.RichText },
  { icon: SplitSvg, name: PdfDiffOutputTypes.Text },
  { icon: DifferenceSvg, name: PdfDiffOutputTypes.Image },
  { icon: TextSvg, name: PdfDiffOutputTypes.OCR },
  { icon: DetailsSvg, name: PdfDiffOutputTypes['File details'] },
];

const redlineOutputType = {
  icon: DetailsSvg,
  name: PdfDiffOutputTypes.Redline,
};

const outputImageTypes: NewOutputType<PdfImageDiffOutputTypes>[] = [
  { icon: HighlightSvg, name: PdfImageDiffOutputTypes.Highlight },
  { icon: SplitSvg, name: PdfImageDiffOutputTypes.Split },
  { icon: FadeSvg, name: PdfImageDiffOutputTypes.Fade },
  { icon: SliderSvg, name: PdfImageDiffOutputTypes.Slider },
  { icon: DifferenceSvg, name: PdfImageDiffOutputTypes.Difference },
];

const getTextDiffLevelOptions = (
  t: (str: string) => string,
): Option<DiffLevel>[] => [
  { value: 'word', label: t('LevelToggle.word') },
  { value: 'character', label: t('LevelToggle.character') },
];

const getPageTypeName = (pageType: string = 'default') => {
  switch (pageType) {
    case 'first':
      return 'First page';
    case 'default':
      return 'Default pages';
    case 'even':
      return 'Even pages';
    default:
      return `${capitalize(pageType)} pages`;
  }
};

const getPageTypeIcon = (pageType: string = 'default') => {
  switch (pageType) {
    case 'first':
      return <PagesFirst />;
    case 'default':
      return <PagesOddSvg />;
    case 'even':
      return <PagesEvenSvg />;
    default:
      return <PagesOddSvg />;
  }
};

type LoadingTextResultsProps = {
  title: string;
  contents: string;
};

export const LoadingTextResults: FC<LoadingTextResultsProps> = ({
  title,
  contents,
}) => {
  return (
    <div
      className={cx(
        pdfOutputSharedCss.output,
        pdfOutputSharedCss.white,
        pdfOutputSharedCss.loader,
      )}
    >
      <LoadingCircle style="secondary" />
      <span className={pdfOutputSharedCss.mainLoadingText}>{title}</span>
      <span>{contents}</span>
    </div>
  );
};

const WORD_MAX_PAGE_SIZE = 1584;

const getOversizedPageIndices = (documentContent: PDFiumDocumentContent) => {
  return documentContent.images
    .filter(
      (image) =>
        image.width > WORD_MAX_PAGE_SIZE || image.height > WORD_MAX_PAGE_SIZE,
    )
    .map((image) => image.pageIndex);
};

type PrepareDocumentPromise = Promise<
  [PDFiumDocument | undefined, PDFiumDocument | undefined]
>;

const PdfDiffChecker: React.FC<PdfDiffCheckerProps> = ({
  initialLeftPath,
  initialRightPath,
  recordingInfo,
  hideAds,
  diffOrigin,
}) => {
  /**
   * Main document states that store the "committed" documents that the user wants to compare.
   * These states represent the source of truth for which documents should be diffed,
   * though they may not be fully processed yet.
   */
  const { state: leftState, setState: setLeftState } = usePdfDocument();
  const { state: rightState, setState: setRightState } = usePdfDocument();

  /**
   * Temporary document states visible in the file input UI.
   *
   * These states allow users to:
   * 1. Upload and preview files before comparing them
   * 2. Cancel or modify their selection before committing to a diff
   * 3. Keep the previous diff results visible while selecting new files
   */
  const tempLeftDocumentManager = usePdfDocument(leftState);
  const tempRightDocumentManager = usePdfDocument(rightState);
  const { setState: setTempLeftState } = tempLeftDocumentManager;
  const { setState: setTempRightState } = tempRightDocumentManager;

  /**
   * State shared between output types
   */
  const [showOutput, setShowOutput] = useState(false);
  const [outputType, setOutputType] = useState<PdfDiffOutputTypes>(
    PdfDiffOutputTypes.RichText,
  );
  const [profiles] = useProfiles();
  const currentProfile = profiles.find(
    (profile: Profile) => profile.name === 'Default',
  );
  const [normalizeWorker, normalizeLoading] = useWorker('normalize', {
    restartable: true,
  });
  const prepareDocumentPromiseRef = useRef<
    PrepareDocumentPromise | undefined
  >();
  const [overallLoading, setOverallLoading] = useState(false);
  const [textDiffOutputSettings, setTextDiffOutputSettings] =
    useState<TextDiffOutputSettingsObject>(defaultTextDiffOutputSettings);
  const textDiffLevelOptions = getTextDiffLevelOptions(t);
  const apiRef = useRef<TextDiffOutputApi>(nullApi);
  const [error, setError] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Rich text state
   */
  const [richTextLoading, setRichTextLoading] = useState(false);
  const [richTextDiffData, setRichTextDiffData] = useState<RichTextDiff>();
  const [richTextDiffLevel, setRichTextDiffLevel] = useState<DiffLevel>('word');
  const [richTextShowMoves, setRichTextShowMoves] = useState(true);
  const [richTextFormattingChanges, setRichTextFormattingChanges] =
    useState(false);
  const [richTextShowFontFamilyChanges, setRichTextShowFontFamilyChanges] =
    useState(true);
  const [richTextShowFontSizeChanges, setRichTextShowFontSizeChanges] =
    useState(true);
  const [richTextShowColorChanges, setRichTextShowColorChanges] =
    useState(true);
  const [richTextExporting, setRichTextExporting] = useState(false);

  /**
   * Text state
   */
  const [textDiffData, setTextDiffData] = useState<Diff>();
  const [headersDiffData, setHeadersDiffData] = useState<HeaderDiff[]>([]);
  const [footersDiffData, setFootersDiffData] = useState<FooterDiff[]>([]);
  const [footnotesDiffData, setFootnotesDiffData] = useState<Diff>();
  const [endnotesDiffData, setEndnotesDiffData] = useState<Diff>();
  const [docxContentTypeView, setDocxContentTypeView] =
    useState<DocxContentTypeView>('content');

  /**
   * OCR state
   */
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrDiffData, setOcrDiffData] = useState<Diff>();

  /**
   * Image state
   */
  const [imageLoading, setImageLoading] = useState(false);
  const [imageDiffData, setImageDiffData] = useState<PdfImageDiffResult[]>();
  const [imageState, setImageState] = useState<ImageState>({
    x: 0,
    y: 0,
    zoomFactor: 1,
  });
  const [imageShowEqualPages, setImageShowEqualPages] = useState(true);
  const [outputImageType, setOutputImageType] = useState(
    PdfImageDiffOutputTypes.Highlight,
  );

  /**
   * Metadata state
   */
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [leftMetadata, setLeftMetadata] = useState<PDFiumMetadataResponse>();
  const [rightMetadata, setRightMetadata] = useState<PDFiumMetadataResponse>();

  /**
   * Redline state
   */
  const [redlineLoading, setRedlineLoading] = useState(false);
  const [redlineError, setRedlineError] = useState<string>();
  const [redlinePDFiumDocId, setRedlinePDFiumDocId] = useState<number>();
  const [redlinePdf, setRedlinePdf] = useState<PdfConversionResult>();
  const [redlineWordDoc, setRedlineWordDoc] = useState<WordDocumentInfo>();
  const [redlinePDFiumContent, setRedlinePDFiumContent] =
    useState<PDFiumDocumentContent>();
  const [redlineOversizedPages, setRedlineOversizedPages] =
    useState<RedlineOversizedPages>();
  const [redlineRevisions, setRedlineRevisions] = useState<RedlineRevision[]>(
    [],
  );
  const [redlineRevisionSummary, setRedlineRevisionSummary] =
    useState<RevisionSummarySections>();
  const [selectedRedlineRevision, setSelectedRedlineRevision] =
    useState<RedlineRevision | null>(null);
  const [redlineRevisionError, setRedlineRevisionError] = useState<string>();
  const [redlineRevisionsLoading, setRedlineRevisionsLoading] = useState(false);
  const [isExportingAcceptedRevisions, setIsExportingAcceptedRevisions] =
    useState(false);
  const [redlineViewType, setRedlineViewType] = useState<RedlineViewType>(
    REDLINE_DEFAULT_VIEW_TYPE,
  );
  const [redlineZoomType, setRedlineZoomType] = useState<ZoomTypeOption>(
    REDLINE_DEFAULT_ZOOM_TYPE,
  );
  const [showRedlineConversionBanner, setShowRedlineConversionBanner] =
    useState(false);
  const currentRedlineDiffIdRef = useRef<string | null>(null);

  const [redlineDiffedAt, setRedlineDiffedAt] = useState<Date>();

  const setShowRedlineConversionBannerAndNotifyVisibility = (show: boolean) => {
    setShowRedlineConversionBanner(show);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      window.ipcRenderer.send(
        ipcEvents.APP__REDLINE_BANNER_VISIBILITY_CHANGED,
        show,
      );
    }
  };

  const setRedlineErrorAndNotifyBannerVisibility = (
    error: string | undefined,
  ) => {
    setRedlineError(error);
    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      window.ipcRenderer.send(
        ipcEvents.APP__REDLINE_ERROR_BANNER_VISIBILITY_CHANGED,
        !!error,
      );
    }
  };

  // Will need to make this more dynamic when we add settings to other PDF output types
  const [redlineOutputSettings, setRedlineOutputSettings] =
    useState<RedlineOutputSettingsObject>(
      currentProfile?.configurations[DiffInputType.PDF][
        PdfDiffOutputTypes.Redline
      ] ?? defaultRedlineOutputSettings,
    );

  useEffect(() => {
    if (showOutput) {
      hideAds?.();
    }
  }, [showOutput, hideAds]);

  useEffect(() => {
    return () => {
      PDFium.destroyAllDocuments();
    };
  }, []);

  // Include redline output type on Windows web/desktop
  useEffect(() => {
    if (
      !outputTypes.includes(redlineOutputType) &&
      (getOs() === 'windows' || getOs() === 'mac')
    ) {
      outputTypes.splice(getOs() === 'windows' ? 1 : 2, 0, redlineOutputType);
    }
  }, []);

  // this is needed to accommodate jotai state updates
  useEffect(() => {
    const globalRedlineSettings =
      currentProfile?.configurations[DiffInputType.PDF][
        PdfDiffOutputTypes.Redline
      ];
    if (globalRedlineSettings) {
      setRedlineOutputSettings(globalRedlineSettings);
    }
  }, [currentProfile?.configurations]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_IS_ELECTRON || getOs() !== 'windows') {
      return;
    }

    const handler = (_event: Event, args: { data: string }) => {
      try {
        const revisions = parseRevisions(args.data);
        setRedlineRevisions(
          revisions.filter((revision) => {
            if (!revision.text) {
              return false;
            }

            return (
              isDeleteRevision(revision) ||
              isInsertRevision(revision) ||
              isMoveRevision(revision) ||
              isStyleRevision(revision)
            );
          }),
        );
        const revisionSummary = getRevisionSummary(revisions);
        setRedlineRevisionSummary(revisionSummary);
      } catch (error) {
        setRedlineRevisionError(RedlineErrorMessages.ERROR_PARSING_REVISIONS);
        captureException(error, {
          tags: {
            'pdf-diff.area': 'redline-revisions',
            'pdf-diff.outputType': PdfDiffOutputTypes.Redline,
          },
        });
      } finally {
        setRedlineRevisionsLoading(false);
      }
    };

    window.ipcRenderer.on(ipcEvents.APP__REDLINE_REVISIONS_READY, handler);

    return () => {
      window.ipcRenderer.removeListener(
        ipcEvents.APP__REDLINE_REVISIONS_READY,
        handler,
      );
    };
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_IS_ELECTRON || getOs() !== 'windows') {
      return;
    }

    const handler = (_event: Event, errorInfo: ElectronErrorInfo) => {
      const error = ElectronError.fromJSON(errorInfo);
      setRedlineErrorAndNotifyBannerVisibility(
        RedlineErrorMessages.ERROR_RENDERING_REDLINE,
      );
      captureException(error, {
        tags: {
          'pdf-diff.area': 'diffRedline-async',
          'pdf-diff.outputType': PdfDiffOutputTypes.Redline,
        },
        contexts: {
          CSharpDiagnostics: {
            ...(error.diagnostics ?? {}),
          },
        },
      });
    };

    window.ipcRenderer.on(ipcEvents.APP__REDLINE_RENDERING_ERROR, handler);

    return () => {
      window.ipcRenderer.removeListener(
        ipcEvents.APP__REDLINE_RENDERING_ERROR,
        handler,
      );
    };
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_IS_ELECTRON || getOs() !== 'windows') {
      return;
    }

    const handler = (_event: Event) => {
      setIsExportingAcceptedRevisions(false);
    };

    window.ipcRenderer.on(
      ipcEvents.APP__REDLINE_EXPORT_ACCEPTED_REVISIONS_COMPLETED,
      handler,
    );

    return () => {
      window.ipcRenderer.removeListener(
        ipcEvents.APP__REDLINE_EXPORT_ACCEPTED_REVISIONS_COMPLETED,
        handler,
      );
    };
  }, []);

  const isAnyOutputTypeLoading =
    overallLoading ||
    richTextLoading ||
    ocrLoading ||
    imageLoading ||
    redlineLoading ||
    redlineRevisionsLoading ||
    normalizeLoading;

  const diffText = useCallback(
    async ({
      leftDocumentContent,
      rightDocumentContent,
      textDiffState,
    }: {
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
      textDiffState: TextDiffState;
    }) => {
      const { textDiffData, textDiffLevel } = textDiffState;

      // We don't check the loading state here because:
      // 1. Text diff uses the normalize worker which has its own loading state that is shared between diffs
      // 2. If normalizeWorker is called while another instance is running, it will override the previous task
      if (!leftDocumentContent || !rightDocumentContent || textDiffData) {
        devLog('skipping text diff', {
          leftDocumentContent,
          rightDocumentContent,
          textDiffData,
        });
        return;
      }

      devLog('computing text diff');

      const { data } = await normalizeWorker({
        left: leftDocumentContent.rawText || leftDocumentContent.text,
        right: rightDocumentContent.rawText || rightDocumentContent.text,
        diffLevel: textDiffLevel,
      });

      if (data) {
        setTextDiffData(data);
      }

      const hasHeaders =
        leftDocumentContent.docxHeaders || rightDocumentContent.docxHeaders;
      const hasFooters =
        leftDocumentContent.docxFooters || rightDocumentContent.docxFooters;
      const hasFootnotes =
        leftDocumentContent.docxFootnotes || rightDocumentContent.docxFootnotes;
      const hasEndnotes =
        leftDocumentContent.docxEndnotes || rightDocumentContent.docxFootnotes;

      if (hasHeaders) {
        const headerDiffs = await computeHeaderDiffs(
          normalizeWorker,
          textDiffLevel,
          leftDocumentContent,
          rightDocumentContent,
        );

        setHeadersDiffData(headerDiffs);
      } else {
        setHeadersDiffData([]);
      }

      if (hasFooters) {
        const footerDiffs = await computeFooterDiffs(
          normalizeWorker,
          textDiffLevel,
          leftDocumentContent,
          rightDocumentContent,
        );

        setFootersDiffData(footerDiffs);
      } else {
        setFootersDiffData([]);
      }

      if (hasFootnotes) {
        const data = await computeFootnotesDiff(
          normalizeWorker,
          textDiffLevel,
          leftDocumentContent,
          rightDocumentContent,
        );

        if (data) {
          setFootnotesDiffData(data);
        }
      } else {
        setFootnotesDiffData(undefined);
      }

      if (hasEndnotes) {
        const data = await computeEndnotesDiff(
          normalizeWorker,
          textDiffLevel,
          leftDocumentContent,
          rightDocumentContent,
        );

        if (data) {
          setEndnotesDiffData(data);
        }
      } else {
        setEndnotesDiffData(undefined);
      }
    },
    [normalizeWorker],
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FileDetailsLoadingProps {}

  const FileDetailsLoading: React.FC<FileDetailsLoadingProps> = () => {
    return (
      <div className={cx(sharedCss.output, sharedCss.white, sharedCss.loader)}>
        <LoadingCircle style="secondary" />
        <span className={sharedCss.mainLoadingText}>Loading details...</span>
        <span>Diffchecker is obtaining the details for each document.</span>
      </div>
    );
  };

  const diffOcr = useCallback(
    async ({
      leftDocumentContent,
      rightDocumentContent,
      ocrDiffState,
    }: {
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
      ocrDiffState: OcrDiffState;
    }) => {
      const { ocrLoading, ocrDiffData, ocrDiffLevel } = ocrDiffState;

      if (
        ocrLoading ||
        !leftDocumentContent ||
        !rightDocumentContent ||
        ocrDiffData
      ) {
        devLog('skipping ocr diff');
        return;
      }

      devLog('computing ocr diff');

      const totalImagesCount =
        leftDocumentContent.images.length + rightDocumentContent.images.length;
      const workersCount = Math.min(
        window.navigator.hardwareConcurrency || 4,
        totalImagesCount,
      );

      const { createWorker, createScheduler } = await import('tesseract.js');
      const scheduler = createScheduler();
      const userJobProgress: { [userJobId: string]: number } = {};

      // Point to local tesseract files if running in electron to enable ocr even when offline
      // Reference: https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
      let localTesseractPaths = {};
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        const appPath = await window.ipcRenderer.invoke(
          ipcEvents.APP__GET_PATH,
        );
        const base =
          `file:///${appPath}` +
          (window.electronIsDev ? '/web' : '/out') +
          '/static/tesseract';
        const tesseractBase = `${base}/tesseract@${process.env.TESSERACT_VERSION}`;
        localTesseractPaths = {
          langPath: `${base}/lang-data`,
          workerPath: `${tesseractBase}/worker.min.js`,
          corePath: `${tesseractBase}/tesseract.js-core`,
        };
      }

      for (let i = 0; i < workersCount; i++) {
        const options: Partial<Tesseract.WorkerOptions> = {
          logger: (m) => {
            // userJobId identifies unique job
            // jobId identifies parent job (can have multiple userJobId under single jobId)
            // Context: https://github.com/naptha/tesseract.js/issues/399
            const { jobId, progress, userJobId } = m;
            if (!jobId) {
              return;
            }
            userJobProgress[userJobId] = progress;
            const totalProgressSum = Object.values(userJobProgress).reduce(
              (acc, val) => Number(acc) + Number(val),
              0,
            );
            const totalProgress = Number(totalProgressSum) / totalImagesCount;
            setOcrProgress(totalProgress);
          },
          ...localTesseractPaths,
        };
        const worker = await createWorker('eng', undefined, options);
        scheduler.addWorker(worker);
      }

      setOcrLoading(true);
      setOcrProgress(0);

      const results = await Promise.all(
        leftDocumentContent.images
          .concat(rightDocumentContent.images)
          .map(async (image) =>
            scheduler.addJob('recognize', await image.toCanvas()),
          ),
      );
      scheduler.terminate();

      const texts = results.map((r) => r.data.text);

      const { data: diffData } = await normalizeWorker({
        left: texts.slice(0, leftDocumentContent.images.length).join(''),
        right: texts.slice(leftDocumentContent.images.length).join(''),
        diffLevel: ocrDiffLevel,
      });

      if (diffData) {
        setOcrDiffData(diffData);
        setOcrLoading(false);
      }
    },
    [normalizeWorker],
  );

  const diffImages = useCallback(
    async ({
      leftDocumentContent,
      rightDocumentContent,
      imageDiffState,
    }: {
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
      imageDiffState: ImageDiffState;
    }) => {
      const { imageLoading, imageDiffData } = imageDiffState;

      if (
        imageLoading ||
        !leftDocumentContent ||
        !rightDocumentContent ||
        imageDiffData
      ) {
        devLog('skipping image diff');
        return;
      }

      devLog('computing image diff');

      setImageLoading(true);
      try {
        const pdfImageDiffResults = await comparePdfImages(
          leftDocumentContent.images,
          rightDocumentContent.images,
        );
        setImageDiffData(pdfImageDiffResults);
      } catch (err) {
        console.error(err);
      } finally {
        setImageLoading(false);
      }
    },
    [],
  );

  const diffMetadata = useCallback(
    async ({
      leftDocument,
      rightDocument,
      metadataDiffState,
    }: {
      leftDocument?: PDFiumDocument;
      rightDocument?: PDFiumDocument;
      metadataDiffState: MetadataDiffState;
    }) => {
      const { metadataLoading, leftMetadata, rightMetadata } =
        metadataDiffState;

      if (
        metadataLoading ||
        !leftDocument ||
        !rightDocument ||
        leftMetadata ||
        rightMetadata
      ) {
        devLog('skipping metadata diff');
        return;
      }

      devLog('computing metadata diff');

      setMetadataLoading(true);
      const leftPromise = leftDocument.getMetadata();
      const rightPromise = rightDocument.getMetadata();

      const [left, right] = await Promise.all([leftPromise, rightPromise]);

      setLeftMetadata(left);
      setRightMetadata(right);
      setMetadataLoading(false);
    },
    [],
  );

  const diffRichText = useCallback(
    async ({
      leftDocumentContent,
      rightDocumentContent,
      richTextDiffState,
    }: {
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
      richTextDiffState: RichTextDiffState;
    }) => {
      const {
        richTextLoading,
        richTextDiffData,
        richTextDiffLevel,
        richTextShowMoves,
      } = richTextDiffState;

      if (
        !leftDocumentContent ||
        !rightDocumentContent ||
        richTextLoading ||
        richTextDiffData
      ) {
        devLog('skipping richtext diff', {
          leftDocumentContent,
          rightDocumentContent,
          richTextLoading,
          richTextDiffData,
        });
        return;
      }

      devLog('computing richtext diff');

      setRichTextLoading(true);
      const richText = await diffRichTextHelper({
        diffLevel: richTextDiffLevel,
        showMoves: richTextShowMoves,
        leftDocumentContent,
        rightDocumentContent,
        normalizeWorker,
      });
      setRichTextDiffData(richText);
      setRichTextLoading(false);
    },
    [normalizeWorker],
  );

  const changeRichTextDiffLevel = useCallback(
    async ({
      level,
      leftDocumentContent,
      rightDocumentContent,
      richTextShowMoves,
    }: {
      level: DiffLevel;
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
      richTextShowMoves: boolean;
    }) => {
      setRichTextDiffLevel(level);

      if (!leftDocumentContent || !rightDocumentContent) {
        return;
      }

      setRichTextLoading(true);
      const richText = await diffRichTextHelper({
        diffLevel: level,
        showMoves: richTextShowMoves,
        leftDocumentContent,
        rightDocumentContent,
        normalizeWorker,
      });

      setRichTextDiffData(richText);
      setRichTextLoading(false);
    },
    [normalizeWorker],
  );

  const changeRichTextShowMoves = useCallback(
    async ({
      showMoves,
      level,
      leftDocumentContent,
      rightDocumentContent,
    }: {
      showMoves: boolean;
      level: DiffLevel;
      leftDocumentContent?: PDFiumDocumentContent;
      rightDocumentContent?: PDFiumDocumentContent;
    }) => {
      setRichTextShowMoves(showMoves);

      if (!leftDocumentContent || !rightDocumentContent) {
        return;
      }

      setRichTextLoading(true);
      const richText = await diffRichTextHelper({
        diffLevel: level,
        showMoves,
        leftDocumentContent,
        rightDocumentContent,
        normalizeWorker,
      });
      setRichTextDiffData(richText);
      setRichTextLoading(false);
    },
    [normalizeWorker],
  );

  const diffRedline = useCallback(
    async ({
      leftState,
      rightState,
      redlineDiffState,
    }: {
      leftState: PdfDocumentState;
      rightState: PdfDocumentState;
      redlineDiffState: RedlineDiffState;
    }) => {
      try {
        const {
          redlineLoading,
          redlineError,
          redlineWordDoc,
          redlineOutputSettings,
          redlineRevisionsLoading,
        } = redlineDiffState;

        // TODO consider conditionally executing redlineWord vs redlinePdf to handle scenario mentioned below
        // we don't check for redlinePdf here b/c if it hasn't finished loading when user switches tabs, we don't want to recompute entire thing
        if (
          redlineLoading ||
          redlineRevisionsLoading ||
          redlineError ||
          redlineWordDoc
        ) {
          devLog('[REDLINE] skipping redline diff');
          return;
        }

        devLog('[REDLINE] starting redline diff');
        setRedlineLoading(true);
        process.env.NEXT_PUBLIC_IS_ELECTRON &&
          window.machine.platform === 'win32' &&
          setRedlineRevisionsLoading(true);

        /**
         * Generate a unique ID for this redline diff operation
         */
        const redlineDiffId = uuid();
        currentRedlineDiffIdRef.current = redlineDiffId;
        devLog('[REDLINE] current redline diff id:', redlineDiffId);

        /**
         * Prepare documents for redline
         */
        const { overSizedPages, documentInfo1, documentInfo2 } =
          await prepareDocumentsForRedline(leftState, rightState);
        const hasOversizedPages =
          overSizedPages.left.length > 0 || overSizedPages.right.length > 0;
        setRedlineOversizedPages(
          hasOversizedPages ? overSizedPages : undefined,
        );
        setShowRedlineConversionBannerAndNotifyVisibility(hasOversizedPages);

        /**
         * Compute redline doc
         */
        devLog('[REDLINE] computing redline doc via word interop');
        const wordDoc = await redlineWord(
          documentInfo1,
          documentInfo2,
          redlineOutputSettings,
        );
        setRedlineWordDoc(wordDoc);
        setRedlineDiffedAt(new Date());

        /**
         * Check if we need to "print out" redline doc when converting
         */
        const shouldPrintOut = await checkIfShouldPrintOut();

        /**
         * On Windows, process the PDF conversion asynchronously in the background so that diffRedline returns quicker
         * On Mac, need to synchronously process the PDF conversion and PDFium loading to display the redline
         */
        if (window.machine.platform === 'win32') {
          const onSuccess = (pdfDoc: PdfConversionResult) => {
            devLog(
              `[REDLINE] setting redlinePdf state for operation: ${redlineDiffId}`,
            );
            setRedlinePdf(pdfDoc);
          };
          const onError = (_error: unknown) => {
            setRedlineErrorAndNotifyBannerVisibility(
              RedlineErrorMessages.PDF_EXPORT_ERROR,
            );
          };
          // don't await this function so that it runs asynchronously
          processWindowsPdfConversionAsync({
            wordDoc,
            redlineDiffId,
            shouldPrintOut,
            currentRedlineDiffIdRef,
            onSuccess,
            onError,
          });
        } else {
          const { pdfDoc, pdfId, content } =
            await processMacPdfConversionAndLoadPdfium(wordDoc, shouldPrintOut);
          setRedlinePdf(pdfDoc);
          setRedlinePDFiumDocId(pdfId);
          setRedlinePDFiumContent(content);
        }
      } catch (error) {
        console.error('Error during diffRedline', {
          error,
        });
        setRedlineErrorAndNotifyBannerVisibility(
          RedlineErrorMessages.ERROR_GENERATING_REDLINE,
        );
        captureException(error, {
          tags: {
            'pdf-diff.area': 'diffRedline',
            'pdf-diff.outputType': PdfDiffOutputTypes.Redline,
          },
          contexts: {
            CSharpDiagnostics: {
              ...(error instanceof ElectronError && error.diagnostics
                ? error.diagnostics
                : {}),
            },
          },
        });
      } finally {
        setRedlineLoading(false);
      }
    },
    [],
  );

  const handleRedlineSettingsChange = useCallback(
    ({
      newRedlineState,
      leftState,
      rightState,
    }: {
      newRedlineState: RedlineDiffState;
      leftState: PdfDocumentState;
      rightState: PdfDocumentState;
    }) => {
      // Cleanup existing redline PDFium doc
      PDFium.destroyDocumentsExcept(
        leftState.document?.id,
        rightState.document?.id,
      );

      currentRedlineDiffIdRef.current = null;
      setRedlineOutputSettings(newRedlineState.redlineOutputSettings);
      setRedlineLoading(newRedlineState.redlineLoading);
      setRedlineErrorAndNotifyBannerVisibility(newRedlineState.redlineError);
      setRedlinePdf(newRedlineState.redlinePdf);
      setRedlineWordDoc(newRedlineState.redlineWordDoc);
      setRedlinePDFiumContent(newRedlineState.redlinePDFiumContent);
      setRedlinePDFiumDocId(newRedlineState.redlinePDFiumDocId);
      setRedlineRevisions(newRedlineState.redlineRevisions);
      setSelectedRedlineRevision(newRedlineState.selectedRedlineRevision);
      setRedlineRevisionError(newRedlineState.redlineRevisionError);
      setRedlineRevisionsLoading(newRedlineState.redlineRevisionsLoading);
      setIsExportingAcceptedRevisions(
        newRedlineState.isExportingAcceptedRevisions,
      );
      setRedlineViewType(newRedlineState.redlineViewType);
      setRedlineZoomType(newRedlineState.redlineZoomType);
      setRedlineRevisionSummary(newRedlineState.redlineRevisionSummary);
      setRedlineDiffedAt(newRedlineState.redlineDiffedAt);

      diffRedline({
        leftState,
        rightState,
        redlineDiffState: newRedlineState,
      });
    },
    [diffRedline],
  );

  const diffByType = useCallback(
    async ({
      type,
      leftState,
      rightState,
      textDiffState,
      richTextDiffState,
      ocrDiffState,
      imageDiffState,
      metadataDiffState,
      redlineDiffState,
    }: {
      type: PdfDiffOutputTypes;
      leftState: PdfDocumentState;
      rightState: PdfDocumentState;
      textDiffState: TextDiffState;
      richTextDiffState: RichTextDiffState;
      ocrDiffState: OcrDiffState;
      imageDiffState: ImageDiffState;
      metadataDiffState: MetadataDiffState;
      redlineDiffState: RedlineDiffState;
    }) => {
      switch (type) {
        case PdfDiffOutputTypes.RichText:
          await diffRichText({
            leftDocumentContent: leftState.documentContent,
            rightDocumentContent: rightState.documentContent,
            richTextDiffState,
          });
          break;
        case PdfDiffOutputTypes.Text:
          await diffText({
            leftDocumentContent: leftState.documentContent,
            rightDocumentContent: rightState.documentContent,
            textDiffState,
          });
          break;
        case PdfDiffOutputTypes.OCR:
          await diffOcr({
            leftDocumentContent: leftState.documentContent,
            rightDocumentContent: rightState.documentContent,
            ocrDiffState,
          });
          break;
        case PdfDiffOutputTypes.Image:
          await diffImages({
            leftDocumentContent: leftState.documentContent,
            rightDocumentContent: rightState.documentContent,
            imageDiffState,
          });
          break;
        case PdfDiffOutputTypes['File details']:
          await diffMetadata({
            leftDocument: leftState.document,
            rightDocument: rightState.document,
            metadataDiffState,
          });
          break;
        case PdfDiffOutputTypes.Redline:
          await diffRedline({
            leftState,
            rightState,
            redlineDiffState,
          });
          break;
      }

      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        const leftPath = leftState.rawDocument?.fileInfo?.filePath;
        const rightPath = rightState.rawDocument?.fileInfo?.filePath;

        if (leftPath && rightPath) {
          const { addRecentDiff } = await import(
            'components/new/recent-diffs/commands/recent-diff-utils'
          );
          addRecentDiff({
            left: { filePath: leftPath },
            right: { filePath: rightPath },
            diffType: DiffInputType.PDF,
          });
        }
      }
    },

    [diffImages, diffMetadata, diffOcr, diffRedline, diffRichText, diffText],
  );

  /**
   * Computes a new diff when the output type changes (e.g. switching from Text to Image view).
   * The left and right documents remain the same, but the diff needs to be recomputed
   * using the new output type.
   */
  const handleOutputTypeChange = useCallback(
    async ({
      newOutputType,
      leftState,
      rightState,
      richTextDiffState,
      textDiffState,
      ocrDiffState,
      imageDiffState,
      metadataDiffState,
      redlineDiffState,
    }: {
      newOutputType: PdfDiffOutputTypes;
      leftState: PdfDocumentState;
      rightState: PdfDocumentState;
      richTextDiffState: RichTextDiffState;
      textDiffState: TextDiffState;
      imageDiffState: ImageDiffState;
      ocrDiffState: OcrDiffState;
      metadataDiffState: MetadataDiffState;
      redlineDiffState: RedlineDiffState;
    }) => {
      setIsEditing(false);
      setError(undefined);
      setOverallLoading(true);
      setError(undefined);

      /**
       * Update output type
       */
      setOutputType(newOutputType);
      Tracking.trackEvent('Changed diff output type', {
        diffInputType: DiffInputType.PDF,
        changedTo: newOutputType,
      });
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        window.ipcRenderer.send(
          ipcEvents.APP__REDLINE_DIFF_TYPE_SELECTED,
          newOutputType === PdfDiffOutputTypes.Redline,
        );
      }

      try {
        /**
         * Skip document preparation and computing diff if output type is redline and prerequsites are not met
         */
        if (newOutputType === PdfDiffOutputTypes.Redline) {
          try {
            await checkRedlinePrerequisites();
          } catch (error) {
            setRedlineError(
              error instanceof Error ? error.message : 'Unknown error',
            );
            return;
          }
        }

        /**
         * Prepare documents for diff
         */
        const [preparedLeftState, preparedRightState] =
          await prepareDocumentsForDiff({
            outputType: newOutputType,
            leftState,
            rightState,
            prepareDocumentPromiseRef,
          });

        /**
         * Update document states
         */
        setLeftState(preparedLeftState);
        setRightState(preparedRightState);
        setTempLeftState(preparedLeftState);
        setTempRightState(preparedRightState);

        /**
         * Compute diff
         */
        await diffByType({
          type: newOutputType,
          leftState: preparedLeftState,
          rightState: preparedRightState,
          textDiffState,
          richTextDiffState,
          ocrDiffState,
          imageDiffState,
          metadataDiffState,
          redlineDiffState,
        });
      } catch (error) {
        console.error('handleOutputTypeChange error', {
          error,
          leftState,
          rightState,
        });

        captureException(error, {
          tags: {
            'pdf-diff.area': 'handleOutputTypeChange',
            'pdf-diff.outputType': newOutputType,
          },
        });

        setError('An unexpected error occurred, please refresh.');
      } finally {
        setOverallLoading(false);
      }
    },
    [
      setLeftState,
      setRightState,
      setTempLeftState,
      setTempRightState,
      diffByType,
    ],
  );

  /**
   * Computes a new diff when the user clicks the "find difference" button.
   * This can either happen on the initial diff or subsequent diffs.
   */
  const handleComputeDiffClick = useCallback(
    async ({
      outputType,
      oldLeftState,
      oldRightState,
      newLeftState,
      newRightState,
      textDiffState,
      richTextDiffState,
      ocrDiffState,
      imageDiffState,
      metadataDiffState,
      redlineDiffState,
    }: {
      outputType: PdfDiffOutputTypes;
      oldLeftState: PdfDocumentState;
      oldRightState: PdfDocumentState;
      newLeftState: PdfDocumentState;
      newRightState: PdfDocumentState;
      richTextDiffState: RichTextDiffState;
      textDiffState: TextDiffState;
      imageDiffState: ImageDiffState;
      ocrDiffState: OcrDiffState;
      metadataDiffState: MetadataDiffState;
      redlineDiffState: RedlineDiffState;
    }) => {
      /**
       * Update document state before async operations.
       *
       * Even though we're going to update it again after async processing,
       * we need to update it early so that if user changes output type during diff computation
       * the output change callback will have fresh state to work with.
       *
       * We don't need to update temp state here since it can't be interacted with anyways (edit header should be disabled)
       */
      setLeftState(newLeftState);
      setRightState(newRightState);

      /**
       * Clear output state
       */
      setIsEditing(false);
      setOverallLoading(true);
      setShowOutput(true);
      setError(undefined);

      // rich text
      setRichTextLoading(richTextDiffState.richTextLoading);
      setRichTextDiffData(richTextDiffState.richTextDiffData);
      setRichTextExporting(richTextDiffState.richTextExporting);

      // text
      setTextDiffData(textDiffState.textDiffData);
      setHeadersDiffData(textDiffState.headersDiffData);
      setFootersDiffData(textDiffState.footersDiffData);
      setFootnotesDiffData(textDiffState.footnotesDiffData);
      setEndnotesDiffData(textDiffState.endnotesDiffData);
      setDocxContentTypeView(textDiffState.docxContentTypeView);

      // image
      setImageLoading(imageDiffState.imageLoading);
      setImageDiffData(imageDiffState.imageDiffData);

      // ocr
      setOcrLoading(ocrDiffState.ocrLoading);
      setOcrProgress(ocrDiffState.ocrProgress);
      setOcrDiffData(ocrDiffState.ocrDiffData);

      // file details
      setLeftMetadata(metadataDiffState.leftMetadata);
      setRightMetadata(metadataDiffState.rightMetadata);

      // redline
      currentRedlineDiffIdRef.current = null;
      setRedlineLoading(redlineDiffState.redlineLoading);
      setRedlineErrorAndNotifyBannerVisibility(redlineDiffState.redlineError);
      setRedlinePdf(redlineDiffState.redlinePdf);
      setRedlineWordDoc(redlineDiffState.redlineWordDoc);
      setRedlinePDFiumContent(redlineDiffState.redlinePDFiumContent);
      setRedlinePDFiumDocId(redlineDiffState.redlinePDFiumDocId);
      setRedlineRevisions(redlineDiffState.redlineRevisions);
      setSelectedRedlineRevision(redlineDiffState.selectedRedlineRevision);
      setRedlineRevisionError(redlineDiffState.redlineRevisionError);
      setRedlineRevisionsLoading(redlineDiffState.redlineRevisionsLoading);
      setIsExportingAcceptedRevisions(
        redlineDiffState.isExportingAcceptedRevisions,
      );
      setRedlineViewType(redlineDiffState.redlineViewType);
      setRedlineZoomType(redlineDiffState.redlineZoomType);
      setRedlineRevisionSummary(redlineDiffState.redlineRevisionSummary);
      setRedlineDiffedAt(redlineDiffState.redlineDiffedAt);

      let preparedLeftState: PdfDocumentState | undefined;
      let preparedRightState: PdfDocumentState | undefined;

      try {
        /**
         * Skip document preparation and computing diff if output type is redline and prerequsites are not met
         */
        if (outputType === PdfDiffOutputTypes.Redline) {
          try {
            await checkRedlinePrerequisites();
          } catch (error) {
            setRedlineError(
              error instanceof Error ? error.message : 'Unknown error',
            );
            return;
          }
        }

        /**
         * Prepare documents for diff
         */

        // if page range has changed, we need to clear document content so it can be recomputed
        const isLeftPageRangeDifferent =
          newLeftState.pageRange.from !== oldLeftState.pageRange.from ||
          newLeftState.pageRange.to !== oldLeftState.pageRange.to;
        const isRightPageRangeDifferent =
          newRightState.pageRange.from !== oldRightState.pageRange.from ||
          newRightState.pageRange.to !== oldRightState.pageRange.to;

        [preparedLeftState, preparedRightState] = await prepareDocumentsForDiff(
          {
            outputType,
            leftState: {
              ...newLeftState,
              documentContent: isLeftPageRangeDifferent
                ? undefined
                : newLeftState.documentContent,
            },
            rightState: {
              ...newRightState,
              documentContent: isRightPageRangeDifferent
                ? undefined
                : newRightState.documentContent,
            },
            prepareDocumentPromiseRef,
          },
        );

        /**
         * Update document states after async operations (including temp state)
         */
        setLeftState(preparedLeftState);
        setRightState(preparedRightState);
        setTempLeftState(preparedLeftState);
        setTempRightState(preparedRightState);

        /**
         * Compute diff
         */
        await diffByType({
          type: outputType,
          leftState: preparedLeftState,
          rightState: preparedRightState,
          textDiffState,
          richTextDiffState,
          ocrDiffState,
          imageDiffState,
          metadataDiffState,
          redlineDiffState,
        });
      } catch (error) {
        console.error('handleComputeDiffClick error', {
          error,
          leftState: newLeftState,
          rightState: newRightState,
        });

        captureException(error, {
          tags: {
            'pdf-diff.area': 'handleComputeDiffClick',
            'pdf-diff.outputType': outputType,
          },
        });

        setError('An unexpected error occurred, please refresh.');
      } finally {
        setOverallLoading(false);
      }
    },
    [
      diffByType,
      setLeftState,
      setRightState,
      setTempLeftState,
      setTempRightState,
    ],
  );

  const imageEventHandler = useCallback(
    (eventType: ImageEvent, dragData?: DraggableData): void => {
      if (eventType === ImageEvent.RESET) {
        setImageState({ x: 0, y: 0, zoomFactor: 1 });
      } else if (
        eventType === ImageEvent.ZOOM_IN ||
        eventType === ImageEvent.ZOOM_OUT
      ) {
        const currentX = imageState.x;
        const currentY = imageState.y;
        const newZoomFactor =
          imageState.zoomFactor *
          (eventType === ImageEvent.ZOOM_IN ? 2 : 1 / 2);
        setImageState({ x: currentX, y: currentY, zoomFactor: newZoomFactor });
      } else if (eventType === ImageEvent.DRAG) {
        const currentX = imageState.x;
        const currentY = imageState.y;
        const currentZoom = imageState.zoomFactor;
        if (dragData) {
          setImageState({
            x: currentX + dragData.deltaX,
            y: currentY + dragData.deltaY,
            zoomFactor: currentZoom,
          });
        }
      }
    },
    [imageState.x, imageState.y, imageState.zoomFactor],
  );

  const docxHasMultipleContentTypes = useMemo(() => {
    const isDocxDiff = checkDocxDiff(
      leftState.rawDocument?.wordDocumentInfo,
      rightState.rawDocument?.wordDocumentInfo,
    );
    const hasHeaders =
      leftState.documentContent?.docxHeaders &&
      rightState.documentContent?.docxHeaders;
    const hasFooters =
      leftState.documentContent?.docxFooters &&
      rightState.documentContent?.docxFooters;
    const hasFootnotes =
      leftState.documentContent?.docxFootnotes &&
      rightState.documentContent?.docxFootnotes;

    return isDocxDiff && (hasHeaders || hasFooters || hasFootnotes);
  }, [
    leftState.rawDocument?.wordDocumentInfo,
    rightState.rawDocument?.wordDocumentInfo,
    leftState.documentContent?.docxFooters,
    leftState.documentContent?.docxFootnotes,
    leftState.documentContent?.docxHeaders,
    rightState.documentContent?.docxFooters,
    rightState.documentContent?.docxFootnotes,
    rightState.documentContent?.docxHeaders,
  ]);

  return (
    <div className={cx(css.pdfDiffChecker, !showOutput && css.dropzone)}>
      <PdfInput
        outputType={outputType}
        setOutputType={setOutputType}
        initialLeftPath={initialLeftPath}
        initialRightPath={initialRightPath}
        leftState={leftState}
        rightState={rightState}
        showDropzone={!showOutput}
        recordingInfo={recordingInfo}
        isAnyOutputTypeLoading={isAnyOutputTypeLoading}
        redlinePDFiumDocId={redlinePDFiumDocId}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleComputeDiffClick={(newLeftState, newRightState) =>
          handleComputeDiffClick({
            outputType,
            oldLeftState: leftState,
            oldRightState: rightState,
            newLeftState,
            newRightState,
            richTextDiffState: {
              richTextDiffData: undefined,
              richTextLoading: false,
              richTextDiffLevel,
              richTextShowMoves,
              richTextExporting: false,
            },
            textDiffState: {
              textDiffData: undefined,
              headersDiffData: [],
              footersDiffData: [],
              footnotesDiffData: undefined,
              endnotesDiffData: undefined,
              docxContentTypeView: 'content',
              textDiffLevel: textDiffOutputSettings.diffLevel,
            },
            imageDiffState: {
              imageDiffData: undefined,
              imageLoading: false,
            },
            ocrDiffState: {
              ocrDiffData: undefined,
              ocrLoading: false,
              ocrProgress: 0,
              ocrDiffLevel: textDiffOutputSettings.diffLevel,
            },
            metadataDiffState: {
              leftMetadata: undefined,
              rightMetadata: undefined,
              metadataLoading: false,
            },
            redlineDiffState: {
              redlineOutputSettings: redlineOutputSettings,
              redlineLoading: false,
              redlineError: undefined,
              redlinePdf: undefined,
              redlineWordDoc: undefined,
              redlinePDFiumContent: undefined,
              redlinePDFiumDocId: undefined,
              redlineRevisions: [],
              selectedRedlineRevision: null,
              redlineRevisionError: undefined,
              redlineRevisionsLoading: false,
              isExportingAcceptedRevisions: false,
              redlineViewType: REDLINE_DEFAULT_VIEW_TYPE,
              redlineZoomType: REDLINE_DEFAULT_ZOOM_TYPE,
              redlineRevisionSummary: undefined,
              redlineDiffedAt: undefined,
            },
          })
        }
        tempLeftDocumentManager={tempLeftDocumentManager}
        tempRightDocumentManager={tempRightDocumentManager}
        diffOrigin={diffOrigin}
      />
      {showOutput && (
        <div
          className={cx(pdfOutputSharedCss.container, {
            [pdfOutputSharedCss.noOuterScrollInElectron]:
              outputType === PdfDiffOutputTypes.RichText,
          })}
        >
          <div className={pdfOutputSharedCss.content}>
            <DiffOutputTypeSwitch
              outputTypes={outputTypes}
              onTypeChange={(option) =>
                handleOutputTypeChange({
                  newOutputType: option,
                  leftState,
                  rightState,
                  richTextDiffState: {
                    richTextDiffData,
                    richTextLoading,
                    richTextDiffLevel,
                    richTextShowMoves,
                    richTextExporting,
                  },
                  textDiffState: {
                    textDiffData,
                    headersDiffData,
                    footersDiffData,
                    footnotesDiffData,
                    endnotesDiffData,
                    docxContentTypeView,
                    textDiffLevel: textDiffOutputSettings.diffLevel,
                  },
                  imageDiffState: {
                    imageDiffData,
                    imageLoading,
                  },
                  ocrDiffState: {
                    ocrDiffData,
                    ocrLoading,
                    ocrProgress,
                    ocrDiffLevel: textDiffOutputSettings.diffLevel,
                  },
                  metadataDiffState: {
                    leftMetadata,
                    rightMetadata,
                    metadataLoading,
                  },
                  redlineDiffState: {
                    redlineOutputSettings,
                    redlineLoading,
                    redlineError,
                    redlinePdf,
                    redlineWordDoc,
                    redlinePDFiumContent,
                    redlinePDFiumDocId,
                    redlineRevisions,
                    selectedRedlineRevision,
                    redlineRevisionError,
                    redlineRevisionsLoading,
                    isExportingAcceptedRevisions,
                    redlineViewType,
                    redlineZoomType,
                    redlineRevisionSummary,
                    redlineDiffedAt,
                  },
                })
              }
              currentlySelectedType={outputType}
            />
            {error && (
              <div
                className={cx(
                  pdfOutputSharedCss.container,
                  pdfOutputSharedCss.output,
                )}
              >
                <div className={cx(pdfOutputSharedCss.content)}>
                  <MessageBanner
                    type="error"
                    title="Something went wrong"
                    message={error}
                    size="default"
                  />
                  <Button
                    style="secondary"
                    tone="base"
                    onClick={() => {
                      handleComputeDiffClick({
                        outputType,
                        oldLeftState: leftState,
                        oldRightState: rightState,
                        newLeftState: leftState,
                        newRightState: rightState,
                        richTextDiffState: {
                          richTextDiffData: undefined,
                          richTextLoading: false,
                          richTextDiffLevel,
                          richTextShowMoves,
                          richTextExporting: false,
                        },
                        textDiffState: {
                          textDiffData: undefined,
                          headersDiffData: [],
                          footersDiffData: [],
                          footnotesDiffData: undefined,
                          endnotesDiffData: undefined,
                          docxContentTypeView: 'content',
                          textDiffLevel: textDiffOutputSettings.diffLevel,
                        },
                        imageDiffState: {
                          imageDiffData: undefined,
                          imageLoading: false,
                        },
                        ocrDiffState: {
                          ocrDiffData: undefined,
                          ocrLoading: false,
                          ocrProgress: 0,
                          ocrDiffLevel: textDiffOutputSettings.diffLevel,
                        },
                        metadataDiffState: {
                          leftMetadata: undefined,
                          rightMetadata: undefined,
                          metadataLoading: false,
                        },
                        redlineDiffState: {
                          redlineOutputSettings: redlineOutputSettings,
                          redlineLoading: false,
                          redlineError: undefined,
                          redlinePdf: undefined,
                          redlineWordDoc: undefined,
                          redlinePDFiumContent: undefined,
                          redlinePDFiumDocId: undefined,
                          redlineRevisions: [],
                          selectedRedlineRevision: null,
                          redlineRevisionError: undefined,
                          redlineRevisionsLoading: false,
                          isExportingAcceptedRevisions: false,
                          redlineViewType: REDLINE_DEFAULT_VIEW_TYPE,
                          redlineZoomType: REDLINE_DEFAULT_ZOOM_TYPE,
                          redlineRevisionSummary: undefined,
                          redlineDiffedAt: undefined,
                        },
                      });
                    }}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {!error && outputType === PdfDiffOutputTypes.RichText && (
              <RichTextOutputContainer
                richTextDiffData={richTextDiffData}
                leftDocumentContent={leftState.documentContent}
                rightDocumentContent={rightState.documentContent}
                richTextFormattingChanges={richTextFormattingChanges}
                richTextShowFontFamilyChanges={richTextShowFontFamilyChanges}
                richTextShowFontSizeChanges={richTextShowFontSizeChanges}
                richTextShowColorChanges={richTextShowColorChanges}
                richTextDiffLevel={richTextDiffLevel}
                richTextShowMoves={richTextShowMoves}
                richTextExporting={richTextExporting}
                richTextLoading={richTextLoading}
                textDiffLevelOptions={textDiffLevelOptions}
                leftState={leftState}
                rightState={rightState}
                changeRichTextDiffLevel={(level) =>
                  changeRichTextDiffLevel({
                    level,
                    leftDocumentContent: leftState.documentContent,
                    rightDocumentContent: rightState.documentContent,
                    richTextShowMoves: richTextShowMoves,
                  })
                }
                changeRichTextShowMoves={(showMoves) =>
                  changeRichTextShowMoves({
                    showMoves,
                    level: richTextDiffLevel,
                    leftDocumentContent: leftState.documentContent,
                    rightDocumentContent: rightState.documentContent,
                  })
                }
                setRichTextFormattingChanges={setRichTextFormattingChanges}
                setRichTextShowColorChanges={setRichTextShowColorChanges}
                setRichTextShowFontFamilyChanges={
                  setRichTextShowFontFamilyChanges
                }
                setRichTextShowFontSizeChanges={setRichTextShowFontSizeChanges}
                setRichTextExporting={setRichTextExporting}
              />
            )}
            {!error && outputType === PdfDiffOutputTypes.Text && (
              <PlainTextOutputContainer
                textDiffData={textDiffData}
                docxHasMultipleContentTypes={docxHasMultipleContentTypes}
                docxContentTypeView={docxContentTypeView}
                footersDiffData={footersDiffData}
                footnotesDiffData={footnotesDiffData}
                headersDiffData={headersDiffData}
                textDiffOutputSettings={textDiffOutputSettings}
                endnotesDiffData={endnotesDiffData}
                apiRef={apiRef}
                setDocxContentTypeView={setDocxContentTypeView}
                setTextDiffOutputSettings={setTextDiffOutputSettings}
                getPageTypeName={getPageTypeName}
                getPageTypeIcon={getPageTypeIcon}
                setTextDiffData={setTextDiffData}
              />
            )}
            {!error && outputType === PdfDiffOutputTypes.OCR && (
              <OCRTextOutputContainer
                ocrDiffData={ocrDiffData}
                textDiffOutputSettings={textDiffOutputSettings}
                apiRef={apiRef}
                setTextDiffOutputSettings={setTextDiffOutputSettings}
                ocrLoading={ocrLoading}
                ocrProgress={ocrProgress}
                leftDocumentContent={leftState.documentContent}
                rightDocumentContent={rightState.documentContent}
                setOcrDiffData={setOcrDiffData}
              />
            )}
            {!error && outputType === PdfDiffOutputTypes.Image && (
              <ImageOutputContainer
                imageDiffData={imageDiffData}
                outputImageType={outputImageType}
                imageState={imageState}
                imageShowEqualPages={imageShowEqualPages}
                outputImageTypes={outputImageTypes}
                imageEventHandler={imageEventHandler}
                handleOutputImageTypeChange={(
                  imageType: PdfImageDiffOutputTypes,
                ) => {
                  setOutputImageType(imageType);
                  Tracking.trackEvent('Changed diff output type', {
                    diffInputType: DiffInputType.PDF,
                    pdfImageDiff: true,
                    changedTo: imageType,
                  });
                }}
                setImageShowEqualPages={setImageShowEqualPages}
              />
            )}
            {!error &&
              outputType === PdfDiffOutputTypes['File details'] &&
              (leftMetadata && rightMetadata ? (
                <FileDetailsOutputContainer>
                  <PdfMetadata left={leftMetadata} right={rightMetadata} />
                </FileDetailsOutputContainer>
              ) : (
                <FileDetailsLoading />
              ))}
            {!error && outputType === PdfDiffOutputTypes.Redline && (
              <RedlineOutputContainer
                redlinePDFiumContent={redlinePDFiumContent}
                redlineError={redlineError}
                redlinePdf={redlinePdf}
                redlineWordDoc={redlineWordDoc}
                redlineOutputSettings={redlineOutputSettings}
                handleRedlineSettingsChange={(newRedlineSettings) =>
                  handleRedlineSettingsChange({
                    newRedlineState: {
                      redlineOutputSettings: newRedlineSettings,
                      redlineLoading: false,
                      redlineError: undefined,
                      redlinePDFiumContent: undefined,
                      redlinePdf: undefined,
                      redlineWordDoc: undefined,
                      redlinePDFiumDocId: undefined,
                      redlineRevisions: [],
                      redlineRevisionsLoading: false,
                      selectedRedlineRevision: null,
                      redlineRevisionError: undefined,
                      isExportingAcceptedRevisions: false,
                      redlineViewType: REDLINE_DEFAULT_VIEW_TYPE,
                      redlineZoomType: REDLINE_DEFAULT_ZOOM_TYPE,
                      redlineRevisionSummary: undefined,
                      redlineDiffedAt: undefined,
                    },
                    leftState,
                    rightState,
                  })
                }
                redlineOversizedPages={redlineOversizedPages}
                leftFilename={leftState.document?.fileInfo.filename || ''}
                rightFilename={rightState.document?.fileInfo.filename || ''}
                leftFilePath={leftState.rawDocument?.fileInfo?.filePath}
                rightFilePath={rightState.rawDocument?.fileInfo?.filePath}
                showRedlineConversionBanner={showRedlineConversionBanner}
                setShowRedlineConversionBanner={
                  setShowRedlineConversionBannerAndNotifyVisibility
                }
                redlineRevisions={redlineRevisions}
                setRedlineRevisions={setRedlineRevisions}
                redlineRevisionSummary={redlineRevisionSummary}
                selectedRedlineRevision={selectedRedlineRevision}
                setSelectedRedlineRevision={setSelectedRedlineRevision}
                redlineRevisionError={redlineRevisionError}
                redlineRevisionsLoading={redlineRevisionsLoading}
                isExportingAcceptedRevisions={isExportingAcceptedRevisions}
                setIsExportingAcceptedRevisions={
                  setIsExportingAcceptedRevisions
                }
                redlineViewType={redlineViewType}
                setRedlineViewType={setRedlineViewType}
                redlineZoomType={redlineZoomType}
                setRedlineZoomType={setRedlineZoomType}
                redlineDiffedAt={redlineDiffedAt}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const diffRichTextHelper = async ({
  diffLevel,
  showMoves,
  leftDocumentContent,
  rightDocumentContent,
  normalizeWorker,
}: {
  diffLevel: DiffLevel;
  showMoves: boolean;
  leftDocumentContent: PDFiumDocumentContent;
  rightDocumentContent: PDFiumDocumentContent;
  normalizeWorker: UseWorkerCall<
    NormalizeDiffInput,
    WorkerMessageDataTypes['normalize']['data']
  >;
}) => {
  if (!leftDocumentContent || !rightDocumentContent) {
    return;
  }

  const { data: diffData } = await normalizeWorker({
    left: convertChunksToLines(leftDocumentContent.chunks),
    right: convertChunksToLines(rightDocumentContent.chunks),
    diffLevel,
    options: {
      computeForRichText: true,
      computeMoves: showMoves,
      dynamicProgrammingMaxLines: 3400,
    },
  });

  if (diffData) {
    const rows = diffData.rows ?? [];
    const moves = diffData.moves;

    const richText = getRichTextDiff(
      rows,
      leftDocumentContent.chunks,
      rightDocumentContent.chunks,
      diffLevel,
      moves,
    );

    return richText;
  }
};

const convertWordDocToPdf = async (
  wordDocumentInfo: WordDocumentInfo,
  fileInfo: FileInfo,
): Promise<PDFiumDocument> => {
  const rawPdf = await convertToPdf(wordDocumentInfo, {
    acceptAllRevisions: true,
  });
  const hash = await calculateHash(wordDocumentInfo.data);

  Tracking.trackEvent('Completed PDF conversion', {
    type: wordDocumentInfo.fileType,
    medium: rawPdf.medium,
  });

  return new Promise<PDFiumDocument>((resolve, reject) => {
    PDFium.loadDocument(rawPdf.data, {
      wordDocumentInfo,
      fileInfo,
      hash,
      onLoad: resolve,
      onError: reject,
    });
  });
};

const outputTypeRequiresPdfConversion = (outputType: PdfDiffOutputTypes) => {
  // These output types never need PDF conversion

  const skipPdfConversion: PdfDiffOutputTypes[] = [
    // TODO uncomment these later when you figure out optimizations
    PdfDiffOutputTypes.Redline,
    // PdfDiffOutputTypes['File details'],
  ];

  if (skipPdfConversion.includes(outputType)) {
    return false;
  }

  // All other output types need PDF conversion
  return true;
};

export default PdfDiffChecker;

/**
 * Prepares documents for diffing.
 * - For uploaded PDFs
 *   - extract content
 * - For uploaded docx files
 *   - attempt to convert docx->pdf
 *   - extract content
 *
 * A shared Promise ref acts as a synchronization lock across all execution paths.
 * This prevents duplicate processing when the same logic is triggered from different
 * sources (e.g. clicking "Find Difference" button or changing output type)
 */
const prepareDocumentsForDiff = async ({
  outputType,
  leftState,
  rightState,
  prepareDocumentPromiseRef,
}: {
  outputType: PdfDiffOutputTypes;
  leftState: PdfDocumentState;
  rightState: PdfDocumentState;
  prepareDocumentPromiseRef: MutableRefObject<
    PrepareDocumentPromise | undefined
  >;
}): Promise<[PdfDocumentState, PdfDocumentState]> => {
  devLog('[PDF Preparation] Preparing documents for diff', {
    outputType,
    leftState,
    rightState,
  });

  /**
   * Attempt pdf conversion for docx files.
   *
   * Conversion may not be required for certain scenarios:
   *   - output type doesn't require it (e.g. redline)
   *   - PDF was already computed in a previous preparation
   */
  let resultLeftState: PdfDocumentState = leftState;
  let resultRightState: PdfDocumentState = rightState;

  const shouldConvertToPdf =
    outputTypeRequiresPdfConversion(outputType) &&
    (!leftState.document || !rightState.document);

  if (shouldConvertToPdf) {
    devLog('[PDF Preparation] Conversion needed - starting attempt', {
      convertingLeft: !leftState.document,
      convertingRight: !rightState.document,
    });

    try {
      if (!prepareDocumentPromiseRef.current) {
        devLog(
          '[PDF Preparation] No existing conversion in progress - starting new conversion',
        );

        prepareDocumentPromiseRef.current = Promise.all([
          leftState.document
            ? leftState.document
            : leftState.rawDocument?.wordDocumentInfo
              ? convertWordDocToPdf(
                  leftState.rawDocument.wordDocumentInfo,
                  leftState.rawDocument.fileInfo,
                )
              : undefined,
          rightState.document
            ? rightState.document
            : rightState.rawDocument?.wordDocumentInfo
              ? convertWordDocToPdf(
                  rightState.rawDocument.wordDocumentInfo,
                  rightState.rawDocument.fileInfo,
                )
              : undefined,
        ]);
      } else {
        devLog(
          '[PDF Preparation] Existing conversion in progress - reusing promise',
        );
      }

      const [convertedLeftPdf, convertedRightPdf] =
        await prepareDocumentPromiseRef.current;

      resultLeftState = {
        ...leftState,
        document: convertedLeftPdf,
        pageRange:
          leftState.pageRange.to > 0
            ? leftState.pageRange
            : { from: 1, to: convertedLeftPdf?.pageCount ?? 1 },
      };
      resultRightState = {
        ...rightState,
        document: convertedRightPdf,
        pageRange:
          rightState.pageRange.to > 0
            ? rightState.pageRange
            : { from: 1, to: convertedRightPdf?.pageCount ?? 1 },
      };
    } finally {
      // clean up promise
      prepareDocumentPromiseRef.current = undefined;
    }
  } else {
    devLog('[PDF Preparation] No conversion needed - skip attempt');
  }

  /**
   * Extract content from PDFs. If it already exists just reuse.
   */
  const isDocxDiff = checkDocxDiff(
    resultLeftState.rawDocument?.wordDocumentInfo,
    resultRightState.rawDocument?.wordDocumentInfo,
  );

  devLog('[PDF Preparation] Attempting to extract content from PDFs', {
    isDocxDiff,
    resultLeftState,
    resultRightState,
  });

  const [pdfContentLeft, pdfContentRight] = await Promise.all([
    resultLeftState.documentContent ??
      resultLeftState.document?.getContent(
        resultLeftState.pageRange,
        isDocxDiff,
      ),
    resultRightState.documentContent ??
      resultRightState.document?.getContent(
        resultRightState.pageRange,
        isDocxDiff,
      ),
  ]);

  return [
    { ...resultLeftState, documentContent: pdfContentLeft },
    { ...resultRightState, documentContent: pdfContentRight },
  ];
};

const checkDocxDiff = (
  leftWordDocumentInfo?: WordDocumentInfo,
  rightWordDocumentInfo?: WordDocumentInfo,
) => {
  return (
    leftWordDocumentInfo?.fileType === DOCX_FILE_TYPE &&
    rightWordDocumentInfo?.fileType === DOCX_FILE_TYPE
  );
};

const prepareDocumentsForRedline = async (
  leftState: PdfDocumentState,
  rightState: PdfDocumentState,
): Promise<{
  overSizedPages: {
    left: number[];
    right: number[];
  };
  documentInfo1: WordDocumentInfo;
  documentInfo2: WordDocumentInfo;
}> => {
  /**
   * Calculate oversized pages
   *
   * This is needed for uploaded PDFs since oversized PDFs breaks redline.
   *
   * For uploaded docx files however, word interop is able to handle oversized pages.
   * So we can just assign an empty list.
   */
  const leftStateOversizedPages = leftState.documentContent
    ? getOversizedPageIndices(leftState.documentContent)
    : [];
  const rightStateOversizedPages = rightState.documentContent
    ? getOversizedPageIndices(rightState.documentContent)
    : [];

  const overSizedPages = {
    left: leftStateOversizedPages,
    right: rightStateOversizedPages,
  };

  /**
   * Generate word docx data for inputs
   */
  const [documentInfo1, documentInfo2] = await Promise.all([
    generateInputWordDocForRedline(leftState, leftStateOversizedPages),
    generateInputWordDocForRedline(rightState, rightStateOversizedPages),
  ]);

  if (!documentInfo1) {
    throw new Error('Document info 1 is missing');
  }

  if (!documentInfo2) {
    throw new Error('Document info 2 is missing');
  }

  return { documentInfo1, documentInfo2, overSizedPages };
};

const generateInputWordDocForRedline = async (
  pdfState: PdfDocumentState,
  oversizedPages: number[],
): Promise<WordDocumentInfo | undefined> => {
  devLog('[REDLINE] attempting to generate word doc', {
    pdfState,
    oversizedPages,
  });

  if (pdfState.rawDocument?.wordDocumentInfo) {
    devLog('[REDLINE] reusing existing word doc', { pdfState });
    return pdfState.rawDocument.wordDocumentInfo;
  }

  if (!pdfState.document) {
    devLog(
      "[REDLINE] can't generate word doc for uploaded PDF without PDFium document",
      { pdfState },
    );
    return undefined;
  }

  let newWordDocumentInfo: WordDocumentInfo | undefined;
  const fileInfo = pdfState.document.fileInfo;

  if (window.machine?.platform === 'darwin') {
    devLog('[REDLINE] generating word doc - mac case', { pdfState });
    const documentContentText = pdfState.documentContent?.text
      ? pdfState.documentContent.text
      : // ! this branch should never hit since content should always be extracted by this point, but just in case :P
        ((await pdfState.document.getContent(pdfState.pageRange))?.text ?? '');

    const data = await stringToDocx(documentContentText);
    newWordDocumentInfo = await window.ipcRenderer.invoke(
      ipcEvents.APP__SAVE_FILE,
      { data, fileName: `${fileInfo.filename}.docx`, fileType: 'docx' },
    );
  } else if (oversizedPages.length > 0) {
    devLog('[REDLINE] generating word doc - oversized pages case', {
      pdfState,
    });
    const data = await pdfState.document.getStandardizedPDF(
      pdfState.pageRange,
      oversizedPages,
    );
    newWordDocumentInfo = {
      data,
      filePath: fileInfo.filePath,
      fileName: fileInfo.filename,
      fileType: 'pdf',
    };
  } else {
    devLog('[REDLINE] generating word doc - base case', { pdfState });
    const data = await pdfState.document.getPDFBuffer(pdfState.pageRange);
    newWordDocumentInfo = {
      data,
      filePath: fileInfo.filePath,
      fileName: fileInfo.filename,
      fileType: 'pdf',
    };
  }

  return newWordDocumentInfo;
};

/**
 * Process PDF conversion asynchronously on Windows
 */
const processWindowsPdfConversionAsync = async ({
  wordDoc,
  redlineDiffId,
  shouldPrintOut,
  currentRedlineDiffIdRef,
  onSuccess,
  onError,
}: {
  wordDoc: WordDocumentInfo;
  redlineDiffId: string;
  shouldPrintOut: boolean;
  currentRedlineDiffIdRef: React.MutableRefObject<string | null>;
  onSuccess: (pdfDoc: PdfConversionResult) => void;
  onError: (error: unknown) => void;
}) => {
  try {
    devLog('[REDLINE] converting redline word doc to pdf on Windows');
    const pdfDoc = await convertToPdf(wordDoc, {
      shouldPrintOut,
      macRedline: false,
    });

    // Check if this is still the current redline diff before calling success callback
    if (currentRedlineDiffIdRef.current !== redlineDiffId) {
      devLog(
        `[REDLINE] PDF conversion superseded by newer diff request:\n` +
          `  Operation ID: ${redlineDiffId}\n` +
          `  Current ID: ${currentRedlineDiffIdRef.current}`,
      );
      return;
    }

    onSuccess(pdfDoc);
  } catch (error) {
    // Capture errors since the async function won't bubble up to the diffRedline error handler
    captureException(error, {
      tags: {
        'pdf-diff.area': 'diffRedline',
        'pdf-diff.outputType': PdfDiffOutputTypes.Redline,
      },
    });

    // Only call the onError callback if this is still the current redline diff
    if (currentRedlineDiffIdRef.current === redlineDiffId) {
      onError(error);
    }
  }
};

const processMacPdfConversionAndLoadPdfium = async (
  wordDoc: WordDocumentInfo,
  shouldPrintOut: boolean,
) => {
  // Convert redline word doc to pdf
  devLog('[REDLINE] converting redline word doc to pdf on Mac');
  const pdfDoc = await convertToPdf(wordDoc, {
    shouldPrintOut,
    macRedline: window.machine.platform === 'darwin',
  });

  // Load redline pdf into pdfium
  const pdf = await new Promise<PDFiumDocument>(async (resolve, reject) => {
    try {
      await PDFium.loadDocument(cloneArrayBuffer(pdfDoc.data), {
        wordDocumentInfo: pdfDoc.documentInfo,
        fileInfo: {
          filename: pdfDoc.documentInfo.fileName,
          fileSize: pdfDoc.data.byteLength,
        },
        onLoad: resolve,
        onError: reject,
      });
    } catch (error) {
      reject(error);
    }
  });

  const content = await pdf.getContent({
    from: 1,
    to: pdf.pageCount,
  });

  return {
    pdfDoc,
    pdfId: pdf.id,
    content,
  };
};

// note that this only includes .docx extensions not .doc
const DOCX_FILE_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
