const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_REGEX = /^(\d{2}):(\d{2})(:(\d{2}))?$/;

/**
 * Compares two values of potentially different types in the following order:
 * 1. Empty strings (treated as smallest)
 * 2. Dates
 * 3. Times
 * 4. Dollar amounts
 * 5. Numbers
 * 6. Strings
 * @param aValue The first value
 * @param bValue The second value
 * @returns A negative number if a < b, positive if a > b, 0 if equal
 */
export function compareValues(value1: string, value2: string): number {
  const unquotedValue1 = value1.replace(/^"(.*)"$/, '$1');
  const unquotedValue2 = value2.replace(/^"(.*)"$/, '$1');
  if (unquotedValue1 === '' && unquotedValue2 === '') {
    return 0;
  }
  if (unquotedValue1 === '') {
    return -1;
  }
  if (unquotedValue2 === '') {
    return 1;
  }

  const dateValue1 = isValidDate(unquotedValue1)
    ? new Date(unquotedValue1)
    : null;
  const dateValue2 = isValidDate(unquotedValue2)
    ? new Date(unquotedValue2)
    : null;
  if (dateValue1 !== null && dateValue2 !== null) {
    return dateValue1.getTime() - dateValue2.getTime();
  }
  if (dateValue1 !== null) {
    return -1;
  }
  if (dateValue2 !== null) {
    return 1;
  }

  const timeValue1 = isValidTime(unquotedValue1)
    ? convertTimeToSeconds(unquotedValue1)
    : null;
  const timeValue2 = isValidTime(unquotedValue2)
    ? convertTimeToSeconds(unquotedValue2)
    : null;
  if (timeValue1 !== null && timeValue2 !== null) {
    return timeValue1 - timeValue2;
  }
  if (timeValue1 !== null) {
    return -1;
  }
  if (timeValue2 !== null) {
    return 1;
  }

  const isDollarValue1 = /^\$/.test(unquotedValue1);
  const isDollarValue2 = /^\$/.test(unquotedValue2);
  const numericValue1 = parseFloat(unquotedValue1.replace(/[$,\s]/g, ''));
  const numericValue2 = parseFloat(unquotedValue2.replace(/[$,\s]/g, ''));
  if (isDollarValue1 && isDollarValue2) {
    return numericValue1 - numericValue2;
  }
  if (isDollarValue1) {
    return -1;
  }
  if (isDollarValue2) {
    return 1;
  }

  if (!isNaN(numericValue1) && !isNaN(numericValue2)) {
    return numericValue1 - numericValue2;
  }

  return unquotedValue1.localeCompare(unquotedValue2, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

// Helper function to convert time string to seconds
function convertTimeToSeconds(timeString: string): number {
  const [hours, minutes, seconds = '0'] = timeString.split(':');
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}

/**
 * Checks if a string is a valid date in yyyy-mm-dd format.
 * @param dateString The string to check
 * @returns True if the string is a valid date, false otherwise
 */
function isValidDate(dateString: string): boolean {
  if (!DATE_REGEX.test(dateString)) {
    return false;
  }
  const [, year, month, day] = DATE_REGEX.exec(dateString)!;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getDate() === parseInt(day)
  );
}

/**
 * Checks if a string is a valid time in HH:MM or HH:MM:SS format.
 * @param timeString The string to check
 * @returns True if the string is a valid time, false otherwise
 */
function isValidTime(timeString: string): boolean {
  if (!TIME_REGEX.test(timeString)) {
    return false;
  }
  const [, hours, minutes, , seconds] = TIME_REGEX.exec(timeString)!;
  return (
    parseInt(hours) < 24 &&
    parseInt(minutes) < 60 &&
    (!seconds || parseInt(seconds) < 60)
  );
}
