const OUTPUT_DATE_FORMAT_DATE_ONLY = 'yyyy-MM-dd';
const OUTPUT_DATE_FORMAT_WITH_TIME = 'yyyy-MM-dd, HH:mm:ss';

// see https://date-fns.org/v3.6.0/docs/format for more information about the below date formats.
const STANDARD_INPUT_DATE_FORMATS = [
  'yyyy-MM-dd',
  'yyyy-MM-dd, HH:mm:ss',
  'dd-MMM-yy',
  'PP', // PP = MMM dd, yyyy              e.g., Sep 17, 2024
  'PPP', //PPP = MMMM dd, yyyy            e.g., September 17, 2024
  'PPPP', //PPPP = EEEE, MMMM dd, yyyy    e.g., Tuesday, September 17, 2024
];

const US_INPUT_DATE_FORMATS = [
  'MM-dd-yyyy',
  'MM-dd-yyyy, HH:mm:ss',
  'MM/dd/yyyy',
  'MM/dd/yyyy, HH:mm:ss',
  ...STANDARD_INPUT_DATE_FORMATS,
];

const EU_INPUT_DATE_FORMATS = [
  'dd-MM-yyyy',
  'dd-MM-yyyy, HH:mm:ss',
  'dd/MM/yyyy',
  'dd/MM/yyyy, HH:mm:ss',
  'dd.MM.yyyy',
  'dd.MM.yyyy, HH:mm:ss',
  ...STANDARD_INPUT_DATE_FORMATS,
];

export async function normalizeDatesUS(data: string[][]): Promise<string[][]> {
  return await normalizeDates(data, US_INPUT_DATE_FORMATS);
}

export async function normalizeDatesEU(data: string[][]): Promise<string[][]> {
  return await normalizeDates(data, EU_INPUT_DATE_FORMATS);
}

async function normalizeDates(
  data: string[][],
  inputDateFormats: string[],
): Promise<string[][]> {
  const { parse, format, isValid } = await import('date-fns');

  return data.map((row) =>
    row.map((value) => {
      const trimmedValue = String(value)
        .trim()
        .replace(/^["']|["']$/g, '');
      const hasTimeInInput = trimmedValue.includes(':');
      for (const dateFormat of inputDateFormats) {
        const parsedDate = parse(trimmedValue, dateFormat, new Date());
        if (isValid(parsedDate)) {
          const outputFormat = hasTimeInInput
            ? OUTPUT_DATE_FORMAT_WITH_TIME
            : OUTPUT_DATE_FORMAT_DATE_ONLY;
          const formattedDate = format(parsedDate, outputFormat);
          return hasTimeInInput ? `${formattedDate}` : formattedDate;
        }
      }
      return value;
    }),
  );
}
