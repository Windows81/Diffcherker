import createApiUrl from 'lib/create-api-url';
import useEffectStateUpdate from 'lib/hooks/use-effect-state-update';
import { normalizeError } from 'lib/messages';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

interface ExplainContextType {
  explanation: string;
  isWaitingForExplain: boolean;
  isExplaining: boolean;
  hasExplanation: boolean;
  isShowingError: boolean;
  explain: (body: JSONValue) => Promise<void>;
  reset: () => void;
}

export class TokenError extends Error {}

const ExplainContext = createContext<ExplainContextType>({
  explanation: '',
  isWaitingForExplain: false,
  isExplaining: false,
  hasExplanation: false,
  isShowingError: false,
  explain: async () => {
    /* noop */
  },
  reset: () => {
    /* noop */
  },
});

type ExplainProviderProps = {
  url?: string;
  defaultExplanation?: string;
  showErrorAsExplanation?: boolean;
  contextKey: unknown;
  onExplain?: (body: JSONValue) => void;
  onError?: (error: Error) => void;
  onComplete?: (explanation: string) => void;
  onReset?: () => void;
};

export const ExplainProvider: React.FC<
  React.PropsWithChildren<ExplainProviderProps>
> = ({
  children,
  url,
  defaultExplanation,
  showErrorAsExplanation,
  contextKey,
  onExplain = () => {
    /* noop */
  },
  onError = () => {
    /* noop */
  },
  onComplete = () => {
    /* noop */
  },
  onReset = () => {
    /* noop */
  },
}) => {
  const [explanation, setExplanation] = useState<string>(
    defaultExplanation ?? '',
  );
  const [isWaitingForExplain, setIsWaitingForExplain] =
    useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [isShowingError, setIsShowingError] = useState<boolean>(false);

  const explanationRef = useRef<string>(explanation);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setExplanation('');
    explanationRef.current = '';
    setIsShowingError(false);
    setIsExplaining(false);
    setIsWaitingForExplain(false);
    onReset();
  }, [onReset]);

  const addChunkToExplanation = useCallback((chunk: string) => {
    setExplanation((curr) => curr + chunk);
    explanationRef.current = explanationRef.current + chunk;
  }, []);

  const hasExplanation = useMemo(() => explanation !== '', [explanation]);

  /** If the context key changes reset the context */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffectStateUpdate(() => reset(), [contextKey]);

  const explain = useCallback(
    async (body: JSONValue) => {
      onExplain(body);

      reset();
      setIsWaitingForExplain(true);
      setIsExplaining(true);

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const { getBrowserPrint } = await import('lib/browserPrint');
      const bp = await getBrowserPrint();

      try {
        const response = await fetch(createApiUrl(url), {
          method: 'POST',
          credentials: 'include',
          headers: {
            accept: 'text/event-stream',
            'content-type': 'application/json',
            'diffchecker-bp': bp,
          },
          body: JSON.stringify(body),
          signal,
        });

        if (response.body && response.status == 200) {
          const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();

          while (true) {
            const { value, done } = await reader.read();
            setIsWaitingForExplain(false);

            if (done || value.includes('[DONE]')) {
              const finalBit = (value ?? '').replace('[DONE]', '');
              addChunkToExplanation(finalBit);
              onComplete(explanationRef.current);
              break;
            }

            addChunkToExplanation(value);
          }

          setIsExplaining(false);
        } else {
          let errData;
          try {
            errData = await response.json();
          } catch (e) {
            errData = response;
          }

          const error = normalizeError(errData, {
            ErrorClass: response.status === 400 ? TokenError : Error,
          });

          if (showErrorAsExplanation) {
            setExplanation(error.message);
            setIsShowingError(true);
          }

          onError(error);
          setIsWaitingForExplain(false);
          setIsExplaining(false);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          onError(error);
        }
        setIsWaitingForExplain(false);
        setIsExplaining(false);
      } finally {
        if (abortControllerRef.current?.signal === signal) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      addChunkToExplanation,
      onComplete,
      onError,
      onExplain,
      reset,
      showErrorAsExplanation,
      url,
    ],
  );

  return (
    <ExplainContext.Provider
      value={{
        explanation,
        isWaitingForExplain,
        isExplaining,
        hasExplanation,
        isShowingError,
        explain,
        reset,
      }}
    >
      {children}
    </ExplainContext.Provider>
  );
};

export default ExplainContext;
