import { useState, useEffect } from 'react';
import { State, useAppSelector } from 'redux/store';
import { DiffInputType } from 'types/diff-input-type';

// Fraction of the time we record
const TEXT_RECORD_FRACTION = 0.0005; // Lower for text diff due to the larger number of events
const RECORD_FRACTION = 0.025;

export const useRRWebRecording = (diffInputType: DiffInputType) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const recordDocumentDiff = useAppSelector(
    (state: State) => state.app.features.recordDocumentDiff,
  );
  const isSavingFiles = useAppSelector(
    (state: State) => state.app.features.saveFilesDocumentDiff,
  );

  useEffect(() => {
    let stopRecording: (() => void) | undefined;

    const setupRecording = async () => {
      if (
        recordDocumentDiff &&
        !process.env.NEXT_PUBLIC_IS_ELECTRON &&
        typeof window !== 'undefined'
      ) {
        const recordFraction =
          diffInputType === DiffInputType.TEXT
            ? TEXT_RECORD_FRACTION
            : RECORD_FRACTION;
        const shouldRecord = Math.random() < recordFraction;
        if (shouldRecord) {
          const [{ enableRRWeb }, { v4: uuid }] = await Promise.all([
            import('../enable-rrweb'),
            import('uuid'),
          ]);
          const dateRecorded = new Date();
          const id = `${uuid()}-${dateRecorded.getTime().toString()}`;
          stopRecording = enableRRWeb(id, diffInputType, dateRecorded);
          setSessionId(id);
          setIsRecording(true);
        }
      }
    };

    setupRecording();

    return () => {
      if (stopRecording) {
        stopRecording();
      }
    };
  }, []);

  return { isRecording, isSavingFiles, sessionId };
};
