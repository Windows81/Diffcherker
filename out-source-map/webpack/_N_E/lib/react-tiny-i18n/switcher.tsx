import React, { useContext } from 'react';

import { languageContext } from './language-provider';

export function Switcher(props: Record<string, unknown>) {
  const { currentLanguageKey, setCurrentLanguage, availableLanguages } =
    useContext(languageContext);

  function onChange(e: React.FormEvent<HTMLSelectElement>) {
    setCurrentLanguage(e.currentTarget.value);
  }

  return (
    <select onChange={onChange} value={currentLanguageKey} {...props}>
      {availableLanguages.map((language) => (
        <option key={language} value={language}>
          {language}
        </option>
      ))}
    </select>
  );
}
