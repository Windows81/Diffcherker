import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import cx from 'classnames';
import { captureException } from 'lib/sentry';
import {
  useState,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { DiffSide } from 'types/diffSide';

import TextDiffInputHeader from './text-diff/text-diff-input-header';
import css from './text-diff-input.module.css';

import { DiffInputType } from 'types/diff-input-type';
import { RecentFile } from './recent-diffs/commands/recent-diff-utils';
import dynamic from 'next/dynamic';
import { AccessErrorInfo } from 'components/file-access-error-modal';
let extensions: Extension[];
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
const client = typeof window !== 'undefined' && window.document; // cannot use optional chain here
if (client) {
  extensions = [
    lineNumbers(),
    highlightSelectionMatches(),
    EditorView.lineWrapping,
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
  ];
}

interface TextDiffInputProps {
  isHome: boolean;
  label: string;
  value?: string;
  side: DiffSide;
  focused?: boolean;
  setFileAccessErrorInfo?: (info: AccessErrorInfo) => void;
  setUploadedPath?: (uploadedPath: string) => void;
}

interface TextDiffInputHandle {
  getValue: () => string | undefined;
}

const TextDiffInput: React.ForwardRefRenderFunction<
  TextDiffInputHandle,
  TextDiffInputProps
> = (
  {
    isHome,
    label,
    value,
    side,
    focused,
    setFileAccessErrorInfo,
    setUploadedPath,
  },
  forwardedRef,
) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const diffTextRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<EditorView>();

  const setup = useCallback((): void => {
    if (!editorRef.current) {
      editorRef.current = new EditorView({
        state: EditorState.create({
          doc: textareaRef.current?.value,
          extensions,
        }),
      });
      if (textareaRef.current) {
        textareaRef.current.parentNode?.insertBefore(
          editorRef.current.dom,
          textareaRef.current,
        );
        textareaRef.current.style.display = 'none';
        editorRef.current.contentDOM.ariaLabel = `${label} input`;
        if (textareaRef.current.form) {
          textareaRef.current.form.addEventListener('submit', () => {
            if (textareaRef.current) {
              textareaRef.current.value =
                editorRef.current?.state.doc.toString() || '';
            }
          });
        }
        if (focused) {
          editorRef.current.focus();
        }
      } else {
        captureException('No textarea!');
      }
    }
  }, [label, focused]);

  useEffect(() => {
    editorRef.current = undefined;
    setup();
    return () => editorRef.current?.destroy();
  }, [setup]);

  useEffect(() => {
    if (editorRef && value !== editorRef.current?.state.doc.toString()) {
      editorRef.current?.setState(
        EditorState.create({
          doc: value ? value : '',
          extensions,
        }),
      );
    }
  }, [value, setup]);

  const handleUploaded = (
    result: string | { data: string | ArrayBuffer | null },
  ): void => {
    if (typeof result !== 'string' && typeof result.data === 'string') {
      editorRef.current?.setState(
        EditorState.create({
          doc: result.data ? result.data : '',
          extensions,
        }),
      );
    }
  };

  useImperativeHandle(forwardedRef, () => ({
    getValue: (): string | undefined => {
      return editorRef.current?.state.doc.toString(); // we can't keep the value synced on keystroke as the performance suffers greatly
    },
  }));

  const handleDropdownFileClick = async (file: RecentFile) => {
    const { fetchLocalFileAsText } = await import(
      'lib/fetch-local-file-as-text'
    );
    const response = await fetchLocalFileAsText(file.filePath);

    const { FileAccessErrors } = await import('types/file-access-errors');
    setUploadedPath?.(file.filePath);

    if (!response.ok) {
      if (setFileAccessErrorInfo) {
        setFileAccessErrorInfo({
          type: FileAccessErrors.RECENT_FILE,
          error: response.error,
        });
      }
      return;
    }

    handleUploaded({
      data: response.text,
    });
  };

  return (
    <div className={css.wrapper}>
      <TextDiffInputHeader
        label={label}
        onChange={handleUploaded}
        side={side}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        buttonRef={buttonRef}
      />
      <div
        className={cx(css.inputContainer, { [css.home]: isHome })}
        ref={diffTextRef}
      >
        {process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <RecentFilesDropdownMenu
            isOpen={openDropdown}
            diffType={DiffInputType.TEXT}
            onItemClick={handleDropdownFileClick}
            setOpen={setOpenDropdown}
            buttonRef={buttonRef}
            variant="textDiff"
          />
        )}
        <textarea
          id={`diff-input-${side}`}
          className={css.inputText}
          ref={textareaRef}
          value={value}
          onChange={() => {
            /* noop, prevents console error on ssr */
          }}
        />
      </div>
    </div>
  );
};

const RecentFilesDropdownMenu = dynamic(
  () => import('./recent-diffs/recent-files-dropdown-menu'),
  {
    ssr: false,
  },
);

export default forwardRef(TextDiffInput);
