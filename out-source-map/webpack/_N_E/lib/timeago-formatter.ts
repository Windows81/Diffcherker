import { Formatter, Suffix, Unit } from 'react-timeago';
import englishStrings from 'react-timeago/lib/language-strings/en';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

export const englishFormatter = buildFormatter(englishStrings);

const formatter = (
  value: number,
  unit: Unit,
  suffix: Suffix,
  epochSeconds: number,
  nextFormatter: Formatter,
  now: () => number,
) => {
  if (unit === 'second') {
    return 'now';
  } else if (unit === 'minute' && value === 1) {
    return 'a minute ago';
  }
  return englishFormatter(
    value,
    unit,
    suffix === 'from now' ? ('' as Suffix) : suffix,
    epochSeconds,
    nextFormatter,
    now,
  );
};

export default formatter;
