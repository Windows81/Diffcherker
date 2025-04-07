import { languageExtensions } from './languageExtensions';
import { GitDiffFileData } from '../../types';

const textDecoder = new TextDecoder();

interface GitDiffTextSettings {
  level?: 'word' | 'character';
}

/**
 * Map of languages from the AI model to languages supported by our
 * syntax highlighting system.
 */
const languageMap = {
  ts: 'typescript',
  js: 'javascript',
  css: 'css',
};

const gitGuessLanguageFromName = async (name: string, _code: string) => {
  const [, ...exts] = name.split('.');
  for (let i = 0; i < exts.length; ++i) {
    const ext = `.${exts.slice(-i, exts.length).join('.')}`;
    if (ext in languageExtensions) {
      return languageExtensions[ext as keyof typeof languageExtensions];
    }
  }
  return null;
};

const gitGuessLanguageFromModel = async (name: string, code: string) => {
  const { ModelOperations } = await import('@vscode/vscode-languagedetection');
  const modelOperations = new ModelOperations({
    modelJsonLoaderFunc: async () => {
      return await import('@vscode/vscode-languagedetection/model/model.json');
    },
    weightsLoaderFunc: async () => {
      const res = await fetch(
        new URL(
          '@vscode/vscode-languagedetection/model/group1-shard1of1.bin',
          import.meta.url,
        ),
      );
      return await res.arrayBuffer();
    },
  });
  const result = await modelOperations.runModel(code);
  const first = result[0];
  if (first && first.confidence > 0.7) {
    let result = first.languageId;
    if (result === 'js' && /\.m?tsx?/.exec(name)) {
      result = 'ts';
    }
    return languageMap[result as keyof typeof languageMap] ?? null;
  }
  return null;
};

const gitGuessLanguage = async (name: string, code: string) => {
  const extGuess = await gitGuessLanguageFromName(name, code);
  const modelGuess = await gitGuessLanguageFromModel(name, code);
  return extGuess ?? modelGuess;
};

/**
 *
 * @param left The left side of the text
 * @param right The right side of the text
 * @returns The magic DiffChecker™ formatted value
 */
export const gitDiffText = async (
  name: string,
  [left, right]: GitDiffFileData,
  settings: GitDiffTextSettings | null | undefined,
) => {
  const { default: normalize } = await import('lib/normalize');
  const leftText = left ? textDecoder.decode(left) : '';
  const rightText = right ? textDecoder.decode(right) : '';
  const diffData = await normalize(
    leftText,
    rightText,
    settings?.level ?? 'word',
  );

  const [leftLanguage, rightLanguage] = await Promise.all([
    gitGuessLanguage(name, leftText),
    gitGuessLanguage(name, rightText),
  ]);

  return {
    added: diffData.added,
    removed: diffData.removed,
    rows: diffData.rows,
    blocks: diffData.blocks,
    lineNumberWidth: diffData.rows.length.toString().length * 8,
    leftLanguage,
    rightLanguage,
  };
};
