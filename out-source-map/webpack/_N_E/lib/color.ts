import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';

extend([mixPlugin]);

export function lighten(initialColor: string, lightenBy: number): string {
  return colord(initialColor)
    .lighten(lightenBy / 100)
    .toHex();
}
export function darken(initialColor: string, darkenBy: number): string {
  return colord(initialColor)
    .darken(darkenBy / 100)
    .toHex();
}

export function mixWithWhite(initialColor: string, ratio: number): string {
  return colord(initialColor)
    .mix('#ffffff', 1 - ratio)
    .toHex();
}

// Returns a identical-looking color as desiredColor, but updated to
// use given alpha value.
// - Return format: #RRGGBBAA
// Assumptions:
//  - desiredColor and background don't have alpha
//  - alpha is from 0 - 1.0
export function getEquivalentColorWithAlpha(
  desiredColor: string,
  alpha: number,
  backgroundColor = '#ffffff',
): string {
  const desired = colord(desiredColor);
  const r = desired.rgba.r;
  const g = desired.rgba.g;
  const b = desired.rgba.b;

  const background = colord(backgroundColor);
  const rB = background.rgba.r;
  const gB = background.rgba.g;
  const bB = background.rgba.b;

  const newRed = Math.round((r - rB + rB * alpha) / alpha);
  const newGreen = Math.round((g - gB + gB * alpha) / alpha);
  const newBlue = Math.round((b - bB + bB * alpha) / alpha);

  alpha = Math.round(alpha * 255);

  return (
    '#' +
    numToPaddedHexString(newRed) +
    numToPaddedHexString(newGreen) +
    numToPaddedHexString(newBlue) +
    numToPaddedHexString(alpha)
  );
}

// Takes an alpha val from 0 - 1.0, and returns #RRGGBBAA format,
// with alpha simply appended (no change to original color)
export function appendAlpha(initialColor: string, alpha: number): string {
  const color = colord(initialColor).toHex().slice(0, 5);
  const a = numToPaddedHexString(alpha * 255);
  return color + a;
}

const numToPaddedHexString = (num: number): string => {
  num = Math.abs(Math.round(num));
  let converted = num.toString(16);
  if (converted.length == 1) {
    converted = '0' + converted;
  }
  return converted;
};
