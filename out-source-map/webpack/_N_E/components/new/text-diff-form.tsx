import AdDisplay from 'components/ad-display';
import Button from 'components/shared/button';
import diffRouter from 'lib/diff-router';
import { t } from 'lib/react-tiny-i18n';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as DiffActions from 'redux/modules/diff-module';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { DiffInputType } from 'types/diff-input-type';
import * as DiffAction from 'redux/modules/diff-module';
import { pageView } from 'lib/gtag';
import { useWorker } from 'lib/hooks/use-worker';
import css from './text-diff-form.module.css';
import TextDiffInput from './text-diff-input';
import { Diff } from 'types/diff';
import normalize from 'lib/normalize';
import { captureMessage } from 'lib/sentry';
import Tracking from 'lib/tracking';
import { defaultTextDiffOutputSettings } from './text-diff-output/settings';
import { sendFileToBucket } from 'lib/s3-bucket';
import { RecordingInfo } from 'types/recordingInfo';
import { AccessErrorInfo } from 'components/file-access-error-modal';

interface TextDiffFormProps {
  isHome: boolean;
  isPro: boolean;
  resetSelectionIndex: () => void;
  left?: string;
  right?: string;
  recordingInfo?: RecordingInfo;
  setLeftAccessErrorInfo?: (leftAccessErrorInfo: AccessErrorInfo) => void;
  setRightAccessErrorInfo?: (rightAccessErrorInfo: AccessErrorInfo) => void;
  setLeftUploadedPath?: (leftUploadedPath: string) => void;
  setRightUploadedPath?: (rightUploadedPath: string) => void;
}

const TextDiffForm: React.FC<TextDiffFormProps> = ({
  isHome,
  isPro,
  resetSelectionIndex,
  left,
  right,
  recordingInfo,
  setLeftAccessErrorInfo,
  setRightAccessErrorInfo,
  setLeftUploadedPath,
  setRightUploadedPath,
}) => {
  type TextDiffInputHandle = React.ElementRef<typeof TextDiffInput>;
  const leftInputRef = useRef<TextDiffInputHandle>(null);
  const rightInputRef = useRef<TextDiffInputHandle>(null);
  const diffLevel = useAppSelector((state) => state.diff.diffLevel);
  const diffLength = useAppSelector((state) => state.diff.diffs.length);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [normalizeWorker, isLoading] = useWorker('normalize');
  const [firstRender, setFirstRender] = useState(true);
  // States to track last values submitted as .txt files to avoid duplicate uploads
  // (i.e., if the user only changed the right value and clicks "Find Difference",
  // we don't want to send a new .txt file for the unchanged left value)
  const [lastSubmittedLeft, setLastSubmittedLeft] = useState<string>('');
  const [lastSubmittedRight, setLastSubmittedRight] = useState<string>('');

  const sendTextFilesToBucket = (leftValue: string, rightValue: string) => {
    if (recordingInfo?.isRecording && recordingInfo?.isSavingFiles) {
      const timestamp = Date.now().toString();
      // Upload left text as a .txt file if changed since last submission
      if (leftValue && leftValue !== lastSubmittedLeft) {
        const leftFile = new File([leftValue], `${timestamp}.txt`, {
          type: 'text/plain',
        });
        sendFileToBucket(
          leftFile,
          recordingInfo.sessionId,
          'left',
          DiffInputType.TEXT,
        );
        setLastSubmittedLeft(leftValue);
      }

      // Upload right text as a .txt file if changed since last submission
      if (rightValue && rightValue !== lastSubmittedRight) {
        const rightFile = new File([rightValue], `${timestamp}.txt`, {
          type: 'text/plain',
        });
        sendFileToBucket(
          rightFile,
          recordingInfo.sessionId,
          'right',
          DiffInputType.TEXT,
        );
        setLastSubmittedRight(rightValue);
      }
    }
  };

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false);
    }
  }, [firstRender]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(DiffActions.actions.clearErrors());
    const leftValue = leftInputRef.current?.getValue();
    const rightValue = rightInputRef.current?.getValue();

    if (!leftValue && !rightValue) {
      return;
    }

    if (leftValue && rightValue) {
      await sendTextFilesToBucket(leftValue, rightValue);
    }

    let diffData: Diff | undefined;
    try {
      const { data } = await normalizeWorker({
        left: leftValue ?? '',
        right: rightValue ?? '',
        diffLevel, // TODO pass actual diff level
      });

      // if not pro, reset toggles for new diffs
      !isPro &&
        dispatch(
          DiffAction.actions.applySettings(defaultTextDiffOutputSettings),
        );

      if (data) {
        Tracking.trackEvent('Created diff', {
          diffInputType: DiffInputType.TEXT,
          type: 'regular',
          rowLength: data.rows?.length ?? 0,
          charCount: (data.left?.length || 0) + (data.right?.length || 0),
        });
        diffData = data;
      }

      // Note: If you console.time this it will show an absurdly high time (4000+ ms!) for large files (10+ mb)
      // Do not worry! This is because the work for our hashing algorithm is being interleaved with some layout
      // work that the browser is doing. Not a problem!
      if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
        const { addRecentTextDiff } = await import(
          'components/new/recent-diffs/commands/recent-diff-utils'
        );
        addRecentTextDiff({
          left: { data: leftValue },
          right: { data: rightValue },
        });
      }
    } catch (e) {
      const normalizedData = normalize(
        leftValue ?? '',
        rightValue ?? '',
        diffLevel,
      );
      diffData = {
        ...normalizedData,
        left: leftValue,
        right: rightValue,
        diffLevel,
      };
      captureMessage(
        "User tried to normalize diff but web worker doesn't exist; Normalized without web worker.",
        'warning',
      );
    }

    if (diffData) {
      dispatch(DiffActions.actions.addDiff(diffData));
      diffRouter.push(
        '/',
        '/text-compare/',
        'text-compare',
        diffLength,
        router.locale || 'en',
      );
      pageView(`/text-compare/`);
      window.scrollTo(0, 0);
      resetSelectionIndex();
    }
  };

  return (
    <div className={css.wrapper}>
      <div id="editor" className={css.editorTracker} />
      <form
        className={css.diffForm}
        onSubmit={isLoading ? undefined : handleSubmit}
      >
        <div className={css.inputContainer}>
          <TextDiffInput
            isHome={isHome}
            label={t('TextDiff.originalTextUpload')}
            side="left"
            focused={isHome}
            ref={leftInputRef}
            value={left}
            setFileAccessErrorInfo={setLeftAccessErrorInfo}
            setUploadedPath={setLeftUploadedPath}
          />
          <TextDiffInput
            isHome={isHome}
            label={t('TextDiff.changedTextUpload')}
            side="right"
            ref={rightInputRef}
            value={right}
            setFileAccessErrorInfo={setRightAccessErrorInfo}
            setUploadedPath={setRightUploadedPath}
          />
        </div>

        {!isPro && (
          <AdDisplay
            diffInputType={DiffInputType.TEXT}
            position="aboveSubmit"
          />
        )}

        <Button
          type="submit"
          style="primary"
          tone="green"
          size="large"
          isLoading={firstRender || isLoading}
        >
          {t('Diff.submit')}
        </Button>

        {!isPro && (
          <AdDisplay
            diffInputType={DiffInputType.TEXT}
            position="belowSubmit"
          />
        )}
      </form>
    </div>
  );
};

export default TextDiffForm;
