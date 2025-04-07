/**
 * Formats a timestamp or Date object into a readable string
 * @param dateInput The timestamp (milliseconds since epoch) or Date object to format
 * @returns A formatted date string like "2/19/2025 2:31 PM"
 */
export const formatDateObject = (dateInput: number | Date): string => {
  if (!dateInput) {
    return '';
  }

  // Convert timestamp to Date object if needed
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  // Validate the date
  if (isNaN(date.getTime())) {
    return '';
  }

  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};
