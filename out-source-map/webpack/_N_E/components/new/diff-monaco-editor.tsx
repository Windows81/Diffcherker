import * as DiffActions from 'redux/modules/diff-module';
import {
  getCSSVariableString,
  getCssVariableHex,
  getCssVariableNumber,
} from 'lib/get-css-variables';
import Tracking from 'lib/tracking';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import React, { useEffect, useRef, useState } from 'react';
import { State } from 'redux/store';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';

import css from './diff-monaco-editor.module.css';
import { useDarkModeValue } from 'lib/state/darkMode';
import { type TextDiffOutputSettingsObject } from './text-diff-output/settings';
import { Diff } from 'types/diff';
import { useWorker } from 'lib/hooks/use-worker';

const MonacoEditor = editor;

let overrideFindInputHelper: (ev: KeyboardEvent) => void;

// Save the last redux data received in a global, so it can be
// accessed via callbacks
const currentReduxData = {
  left: '',
  right: '',
  syntaxHighlight: '',
};

const assignCurrentReduxData = (
  left: string,
  right: string,
  syntaxHighlight: string,
) => {
  currentReduxData.left = left;
  currentReduxData.right = right;
  currentReduxData.syntaxHighlight = syntaxHighlight;
};

interface DiffEditorStringData {
  originalModelString?: string;
  modifiedModelString?: string;
}

const extractTextFromDiffEditor = (
  diffEditor: editor.IStandaloneDiffEditor,
): DiffEditorStringData => {
  const originalModel = diffEditor.getOriginalEditor().getModel();
  const modifiedModel = diffEditor.getModifiedEditor().getModel();

  const originalModelString = originalModel?.getValue();
  const modifiedModelString = modifiedModel?.getValue();

  return { originalModelString, modifiedModelString };
};

// Forced to use a custom theme, since the minimap (overviewruler)
// is a canvas element (so the colors aren't overridable from outside)
const resetDiffEditorTheme = (isDarkMode: boolean): void => {
  const editorBackground = getCssVariableHex(
    '--theme-colors-background-strongest',
  );

  const editorText = getCssVariableHex('--theme-colors-text-stronger');

  const lineNumberText = getCssVariableHex('--theme-colors-text-medium');

  const removedHighlight = getCssVariableHex(
    '--theme-colors-diff-highlight-removed',
  );
  const insertedHighlight = getCssVariableHex(
    '--theme-colors-diff-highlight-inserted',
  );

  const removedBackground = getCssVariableHex(
    '--theme-colors-diff-block-removed',
  );
  const insertedBackground = getCssVariableHex(
    '--theme-colors-diff-block-inserted',
  );

  const shadowColor = getCssVariableHex('--theme-colors-text-strongest');

  MonacoEditor.defineTheme('custom', {
    base: isDarkMode ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'scrollbarSlider.background': `${shadowColor}33`, // 20% opacity
      'scrollbarSlider.hoverBackground': `${shadowColor}4D`, // 30% opacity
      'scrollbarSlider.activeBackground': `${shadowColor}66`, // 40% opacity
      'scrollbar.shadow': `${shadowColor}33`, // 20% opacity
      'widget.shadow': `${shadowColor}33`, // 20% opacity

      'editor.background': editorBackground,
      'editor.foreground': editorText,
      'editorCursor.foreground': editorText,
      'editorLineNumber.foreground': lineNumberText,
      'editorLineNumber.activeForeground': lineNumberText,

      'diffEditorGutter.removedLineBackground': editorBackground,
      'diffEditorGutter.insertedLineBackground': editorBackground,

      'diffEditor.removedTextBackground': removedHighlight,
      'diffEditor.insertedTextBackground': insertedHighlight,

      'diffEditor.removedLineBackground': removedBackground,
      'diffEditor.insertedLineBackground': insertedBackground,

      'diffEditorOverview.removedForeground': removedHighlight,
      'diffEditorOverview.insertedForeground': insertedHighlight,
    },
  });
  MonacoEditor.setTheme('custom');
};

const getEditorOptions = (
  isInline: boolean,
): editor.IStandaloneDiffEditorConstructionOptions => {
  return {
    unicodeHighlight: {
      invisibleCharacters: false,
      ambiguousCharacters: false,
    },
    experimental: {
      showMoves: true,
    },
    ignoreTrimWhitespace: false,
    originalEditable: true,
    enableSplitViewResizing: true,
    renderSideBySide: !isInline,
    automaticLayout: true,
    dragAndDrop: true,
    renderGutterMenu: false,
    fixedOverflowWidgets: false,
    quickSuggestions: { other: false, comments: false, strings: false },
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    codeLens: false,
    accessibilitySupport: 'off',
    lightbulb: { enabled: editor.ShowLightbulbIconMode.Off },
    snippetSuggestions: 'none',
    hover: { enabled: false },
    contextmenu: true,
    wrappingStrategy: 'advanced', // slower but need this because otherwise we get infinite loops on https://www.diffchecker.com/NOXNMv5A moving from live to regular
    renderControlCharacters: false, // re-enable this when we update monaco https://github.com/microsoft/vscode/commit/7cd137263a8821e9320d6e38fc89f4796e056a3d
    wordWrap: 'on',
    scrollbar: { vertical: 'hidden', verticalScrollbarSize: 0 },

    fontSize: getCssVariableNumber('--typography-code-default-size'),
    lineDecorationsWidth: 8,

    fontFamily: getCSSVariableString('--typography-code-fontFamily'),
    lineHeight: getCssVariableNumber('--typography-code-lineHeight'),

    renderMarginRevertIcon: false,
    roundedSelection: false,
    renderLineHighlight: 'none', // border that shows which line is currently being typed on
  };
};

const fetchAndConvertMonacoSyntaxHighlight = (
  diffEditor: editor.IStandaloneDiffEditor,
): string => {
  const syntaxHighlight = diffEditor
    .getOriginalEditor()
    ?.getModel()
    ?.getLanguageId();
  if (syntaxHighlight === 'plaintext') {
    return '';
  }
  return syntaxHighlight || '';
};

const disposeMonacoEditor = (
  diffEditor: editor.IStandaloneDiffEditor | undefined,
) => {
  if (!diffEditor) {
    return;
  }
  try {
    diffEditor.getOriginalEditor().dispose();
    diffEditor.getModifiedEditor().dispose();
    MonacoEditor.getModels().forEach((model) => model.dispose());
    diffEditor.dispose();
  } catch (err) {
    console.error('Attempted editor disposal: ', err);
  }
};

// If ctrl-f occurs somewhere else on the document,
// override default functionality and trigger original editor
// find if in split view. Else in inline view, trigger find for
// modified editor cause it won't work on original editor.
const overrideFindInput = (
  e: KeyboardEvent,
  diffEditor: editor.IStandaloneDiffEditor,
  isInline: boolean,
): void => {
  try {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const originalEditor = diffEditor.getOriginalEditor();
      const modifiedEditor = diffEditor.getModifiedEditor();
      if (isInline) {
        modifiedEditor.focus();
        void modifiedEditor.getAction('actions.find')?.run();
        return;
      }
      if (modifiedEditor.hasTextFocus()) {
        return;
      }
      originalEditor.focus();
      void originalEditor.getAction('actions.find')?.run();
    }
  } catch (err) {
    console.error(err);
  }
};

const removeKeyListener = () => {
  if (document !== null && overrideFindInputHelper) {
    document.removeEventListener('keydown', overrideFindInputHelper);
  }
};

const addKeyListener = (
  diffEditor: editor.IStandaloneDiffEditor,
  isInline: boolean,
) => {
  if (document !== null) {
    overrideFindInputHelper = (e: KeyboardEvent): void => {
      overrideFindInput(e, diffEditor, isInline);
    };
    document.addEventListener('keydown', overrideFindInputHelper);
  }
};

type DiffMonacoEditorProps = {
  diff?: Diff;
  settings?: TextDiffOutputSettingsObject;
  onChange?: (newDiff: Diff) => void;
};

const DiffMonacoEditor: React.FC<DiffMonacoEditorProps> = ({
  diff,
  settings,
  onChange,
}) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const [diffEditor, setDiffEditor] = useState<editor.IStandaloneDiffEditor>();

  const appLeft = useAppSelector((state: State) => getDiff(state).left || '');
  const appRight = useAppSelector((state: State) => getDiff(state).right || '');

  const syntaxHighlightRedux = useAppSelector(
    (state: State) => getDiff(state).syntaxHighlight || '',
  );
  const isUnifiedRedux = useAppSelector(
    (state: State) => state.user.diffType === 'unified',
  );

  const left = diff?.left ?? appLeft;
  const right = diff?.right ?? appRight;
  const syntaxHighlight = settings?.syntaxHighlight ?? syntaxHighlightRedux;
  const isUnified = !!settings?.diffType
    ? settings?.diffType === 'unified'
    : isUnifiedRedux;

  const isDarkModeRedux = useDarkModeValue();

  assignCurrentReduxData(left, right, syntaxHighlight);

  const [normalizeWorker] = useWorker('normalize', { restartable: true });

  useEffect(() => {
    if (!ref?.current) {
      return;
    }

    if (window.MonacoEnvironment) {
      window.MonacoEnvironment.getWorkerUrl = (
        _moduleId: string,
        label: string,
      ) => {
        if (label === 'json') {
          return '../_next/static/json.worker.js';
        }
        if (label === 'css') {
          return '../_next/static/css.worker.js';
        }
        if (label === 'html') {
          return '../_next/static/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '../_next/static/ts.worker.js';
        }
        return '../_next/static/editor.worker.js';
      };
    }

    disposeMonacoEditor(diffEditor);

    const newDiffEditor = MonacoEditor.createDiffEditor(
      ref.current,
      getEditorOptions(isUnified),
    );

    addKeyListener(newDiffEditor, isUnified);

    newDiffEditor.onDidUpdateDiff(async () => {
      const diffEditorStringData = extractTextFromDiffEditor(newDiffEditor);
      const monacoLeft = diffEditorStringData.originalModelString;
      const monacoRight = diffEditorStringData.modifiedModelString;

      const isResetting = monacoLeft === undefined && monacoRight === undefined;

      const currentSyntaxHighlight =
        fetchAndConvertMonacoSyntaxHighlight(newDiffEditor);

      if (
        (currentSyntaxHighlight === currentReduxData.syntaxHighlight &&
          monacoLeft === currentReduxData.left &&
          monacoRight === currentReduxData.right) ||
        isResetting
      ) {
        return; // don't create diff unecessarily
      }

      const left = diffEditorStringData.originalModelString;
      const right = diffEditorStringData.modifiedModelString;
      Tracking.trackEvent('Created diff', {
        diff: 'text',
        type: 'real-time',
        left: !!left,
        right: !!right,
      });

      if (onChange) {
        const { data: diffData } = await normalizeWorker({
          left: left ?? '',
          right: right ?? '',
        });

        if (diffData) {
          onChange({ ...diff, ...diffData });
        }

        return;
      }

      dispatch(
        DiffActions.actions.createDiff({
          left,
          right,
          syntaxHighlight: currentSyntaxHighlight,
          localTime: '',
        }),
      );
    });

    setDiffEditor(newDiffEditor);

    return () => {
      disposeMonacoEditor(newDiffEditor);
      removeKeyListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  useEffect(() => {
    if (!diffEditor) {
      return;
    }
    removeKeyListener();
    diffEditor.updateOptions(getEditorOptions(isUnified));
    addKeyListener(diffEditor, isUnified);
  }, [diffEditor, isUnified]);

  useEffect(() => {
    if (!diffEditor) {
      return;
    }

    const currentSyntaxHighlight =
      fetchAndConvertMonacoSyntaxHighlight(diffEditor);

    const syntaxHighlightChanged =
      currentSyntaxHighlight !== syntaxHighlight &&
      syntaxHighlight !== undefined;

    let diffEditorStringData = extractTextFromDiffEditor(diffEditor);

    resetDiffEditorTheme(isDarkModeRedux); // Position could be optimized?

    if (
      left === diffEditorStringData.originalModelString &&
      right === diffEditorStringData.modifiedModelString &&
      !syntaxHighlightChanged
    ) {
      // don't update models if syntax highlight & left/right aren't changed externally
      return;
    }

    const originalModel = MonacoEditor.createModel(left, 'text/plain');
    const modifiedModel = MonacoEditor.createModel(right, 'text/plain');
    try {
      if (syntaxHighlightChanged && syntaxHighlight !== undefined) {
        MonacoEditor.setModelLanguage(modifiedModel, syntaxHighlight);
        MonacoEditor.setModelLanguage(originalModel, syntaxHighlight);
      }
      diffEditor.setModel(null);
      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
    } catch (err) {
      console.error(err);
    }

    diffEditorStringData = extractTextFromDiffEditor(diffEditor);
  }, [left, right, diffEditor, isUnified, syntaxHighlight, isDarkModeRedux]);

  // !important required to override monaco editor's styles that have high specificity
  return <div ref={ref} className={css.container} />;
};

export default DiffMonacoEditor;
