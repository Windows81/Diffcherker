import { useContext } from 'react';

import { get } from './get';
import { type LanguageContext, languageContext } from './language-provider';

function replace(string: string, replacements: Record<string, string>) {
  let newString = string;

  Object.keys(replacements).forEach((key) => {
    newString = newString.replace(
      new RegExp(`{{${key}}}`, 'gm'),
      replacements[key],
    );
  });

  return newString;
}

type Replacements = Record<string, string>;

interface TranslatorProps {
  children: string;
  replacements?: Replacements;
}

export function Translator({ children, replacements = {} }: TranslatorProps) {
  const { currentLanguage } = useContext<LanguageContext>(languageContext);
  let text;

  // This allows nesting keys deeper than one level
  if (typeof currentLanguage === 'string') {
    text = currentLanguage;
  } else {
    text = get(currentLanguage, children, children);
  }

  if (replacements) {
    text = replace(text, replacements);
  }

  return text;
}

// Create a way to use the translator outside of a React component
export function t(path: string, replacements: Replacements = {}): string {
  return Translator({ children: path, replacements });
}
