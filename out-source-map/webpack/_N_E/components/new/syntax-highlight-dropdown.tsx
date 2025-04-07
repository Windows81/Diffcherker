import Dropdown from 'components/shared/dropdown';
import { t } from 'lib/react-tiny-i18n';
import syntaxHighlightLanguages from 'lib/syntax-highlight-languages.json';
import Tracking from 'lib/tracking';
import { useState } from 'react';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppSelector } from 'redux/store';

interface SyntaxHighlightDropdownProps {
  value?: string;
  handleChange?: (syntaxHighlight: string) => void;
  checkIfAllowed: () => boolean;
}

const SyntaxHighlightDropdown: React.FC<SyntaxHighlightDropdownProps> = ({
  value,
  handleChange,
  checkIfAllowed,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const syntaxHighlight = useAppSelector(
    (state) => getDiff(state).syntaxHighlight,
  );

  handleChange = !!handleChange
    ? handleChange
    : (_syntaxHighlight: string) => {
        /* noop */
      };

  value = value ?? syntaxHighlight;

  const clickDropdown = async (newValue: string) => {
    if (newValue === '' || (newValue !== value && checkIfAllowed())) {
      Tracking.trackEvent('Changed syntax highlighting language', {
        syntaxChangedTo: newValue || 'none',
      });
      handleChange(newValue);
    }
  };

  return (
    <Dropdown<string>
      isOpen={isOpen}
      setIsOpen={(newState) => {
        setIsOpen(newState);
      }}
      options={syntaxHighlightLanguages}
      onChange={({ value }) => clickDropdown(value)}
      display={
        (value &&
          syntaxHighlightLanguages.find((option) => option.value === value)
            ?.label) ||
        t('AdvancedDiffDropdown.chooseSyntax')
      }
    />
  );
};

export default SyntaxHighlightDropdown;
