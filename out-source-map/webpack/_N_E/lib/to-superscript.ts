const integerSuperscripts = new Map([
  ['0', '⁰'], // Superscript 0 (U+2070)
  ['1', '¹'], // Superscript 1 (U+00B9)
  ['2', '²'], // Superscript 2 (U+00B2)
  ['3', '³'], // Superscript 3 (U+00B3)
  ['4', '⁴'], // Superscript 4 (U+2074)
  ['5', '⁵'], // Superscript 5 (U+2075)
  ['6', '⁶'], // Superscript 6 (U+2076)
  ['7', '⁷'], // Superscript 7 (U+2077)
  ['8', '⁸'], // Superscript 8 (U+2078)
  ['9', '⁹'], // Superscript 9 (U+2079)
]);

// Convert a number to a string of integer superscript characters
// Example: toIntegerSuperscript(123) => '¹²³'
export const toIntegerSuperscript = (n: number): string => {
  const digits = n.toString().split('');
  return digits.map((digit) => integerSuperscripts.get(digit)).join('');
};

const romanNumerals = [
  { numeral: 'm', value: 1000 },
  { numeral: 'cm', value: 900 },
  { numeral: 'd', value: 500 },
  { numeral: 'cd', value: 400 },
  { numeral: 'c', value: 100 },
  { numeral: 'xc', value: 90 },
  { numeral: 'l', value: 50 },
  { numeral: 'xl', value: 40 },
  { numeral: 'x', value: 10 },
  { numeral: 'ix', value: 9 },
  { numeral: 'v', value: 5 },
  { numeral: 'iv', value: 4 },
  { numeral: 'i', value: 1 },
];

// Convert a number to a string of Roman numerals
// Example: toRomanNumeral(123) => 'cxxiii'
const toRomanNumeral = (n: number): string => {
  if (n < 1 || n > 3999) {
    throw new Error('Number must be between 1 and 3999');
  }

  let result = '';
  for (const { numeral, value } of romanNumerals) {
    const count = Math.floor(n / value);
    if (count > 0) {
      result += numeral.repeat(count);
      n -= value * count;
    }
  }

  return result;
};

const romanNumeralSuperscripts = new Map([
  ['i', 'ⁱ'], // Superscript i (U+2071)
  ['v', 'ᵛ'], // Superscript v (U+1D57)
  ['x', 'ˣ'], // Superscript x (U+02E3)
  ['l', 'ˡ'], // Superscript l (U+02E1)
  ['c', 'ᶜ'], // Superscript c (U+1D9C)
  ['d', 'ᵈ'], // Superscript d (U+1D48)
  ['m', 'ᵐ'], // Superscript m (U+1D50)
]);

// Convert a number to a string of Roman numeral superscript characters
// Example: toRomanNumeralSuperscript(123) => 'ᶜˣˣⁱⁱⁱ'
export const toRomanNumeralSuperscript = (n: number): string => {
  const romanNumeral = toRomanNumeral(n);
  return romanNumeral
    .split('')
    .map((char) => {
      const superscript = romanNumeralSuperscripts.get(char);
      if (!superscript) {
        throw new Error(`No superscript for character ${char}`);
      }
      return superscript;
    })
    .join('');
};
