import { colord } from 'colord';

const getCSSVariable = (
  variableName: string,
  element?: HTMLElement,
): string | undefined => {
  if (typeof getComputedStyle === 'undefined') {
    console.error('getCSSVariableString is not supported right now');
    return;
  }
  const pageElement = element ?? document.getElementById('page');
  if (pageElement) {
    if (pageElement.classList.contains('dark')) {
      pageElement.classList.remove('dark');
      const cssStyle = getComputedStyle(pageElement)
        .getPropertyValue(variableName)
        .trim();
      pageElement.classList.add('dark');
      return cssStyle;
    }
    return getComputedStyle(pageElement).getPropertyValue(variableName).trim();
  }
};
export const getCSSVariableString = (variableName: string): string => {
  return getCSSVariable(variableName) || 'unsupported';
};

/** * Assumes the variable value is a color string with appropriate input type for the `colord` library.
 *   https://github.com/omgovich/colord#color-parsing
 */
export const getCssVariableHex = (
  variableName: string,
  element?: HTMLElement,
): string => {
  const variable = getCSSVariable(variableName, element) || '#ffffff';

  return colord(variable).toHex();
};

/** Assumes the variable is a number without units (used to cover 0 case) or with px units. */
export const getCssVariableNumber = (
  variableName: string,
  element?: HTMLElement,
): number => {
  let variable = getCSSVariable(variableName, element) || '0';

  if (variable.endsWith('px')) {
    variable = variable.replace('px', '');
  }

  return Number(variable);
};
