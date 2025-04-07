import { darken, mixWithWhite } from 'lib/color';
import { rem } from 'lib/rem';

export const dimensions = {
  content: {
    width: '1180px',
  },
  sidebar: {
    width: '190px',
  },
  header: {
    height: '60px',
  },
  toolbar: {
    height: '70px',
  },
};

export const breakpoints = {
  web: {
    small: '590px',
    medium: '720px',
    large: '1120px',
  },
  app: {
    large: '1024px',
    medium: '940px',
  },
};

export const colors = {
  white: '#FFFFFF',
  black: '#000000',
  semiTransparent: {
    overlay: 'rgba(22, 27, 29, 0.5)',
    selection: 'rgba(152, 82, 241, 0.4)',
  },
  socialMedia: {
    facebook: {
      default: '#395185',
      medium: '#E1E5ED',
      light: '#F1F3F6',
    },
    twitter: {
      default: '#55ACEE',
      medium: '#DDEEFC',
      light: '#EEF7FD',
    },
  },
  grey: {
    lighter: '#F7F8F9',
    light: '#EAEEF0',
    faded: '#D9E0E3',
    default: '#C4CFD4',
    medium: '#8197A2',
    dark: '#566B76',
    darker: '#2C363C',
    darkest: '#161B1D',
  },
  brand: {
    default: '#08C988',
    light: '#80E0BD',
    lighter: '#DDF7EE',
    lightest: '#EBFAF5',
    dark: '#08bd81',
    darker: '#009E68',
    darkest: '#003322',
  },
  red: {
    default: '#FF3B30',
    darkest: '#452121',
    dark: '#E10C00',
    medium: '#FF9D97',
    light: '#FFF5F5',
  },
  purple: {
    default: '#9852F1',
    darkest: '#302647',
    light: '#FAF6FE',
  },
  blue: {
    default: '#5262F1',
    darkest: '#262947',
    light: '#F6F7FE',
  },
  orange: {
    default: '#FF8C02',
    darkest: '#453218',
    light: '#FFF9F2',
  },
};

export const defaults = {
  animationTime: '.3s',
  borderRadius: '4px',
  focusOutline: `0 0 0 2px var(--brand-light)`,
  focusOutlineButton: `0 0 0 3px var(--back-strongest), 0 0 0 5px var(--brand-medium)`,
  shadowStatic: '0 1px 2px 0 rgba(0,0,0,0.05)',
  shadowHover: '0 2px 15px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.05)',
  shadowActive: '0 4px 20px 0 rgba(0,0,0,0.25), 0 1px 2px 0 rgba(0,0,0,0.15)',
  shadowSoft: '0px 5px 30px rgba(44, 54, 59, 0.1)',
};

export const text = {
  family: {
    sansSerif:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    monospace:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;',
  },
  title: {
    weight: 600,
    default: {
      size: rem(17),
    },
    large: {
      size: rem(48),
    },
    medium: {
      size: rem(24),
    },
    small: {
      size: rem(13),
    },
    tiny: {
      size: rem(11),
      letterSpacing: rem(0.1),
    },
  },
  label: {
    weight: 400,
    bold: {
      weight: 500,
    },
    large: {
      size: rem(16),
    },
    default: {
      size: rem(13),
    },
    small: {
      size: rem(12),
    },
  },
  button: {
    weight: 500,
    default: {
      size: rem(13),
    },
    big: {
      size: rem(16),
    },
    tiny: {
      size: rem(10),
    },
  },
  paragraph: {
    default: {
      size: rem(16),
    },
    small: {
      size: rem(11),
    },
  },
  code: {
    size: rem(13),
    sizePx: 13,
  },
};

export const diff = {
  insert: {
    default: mixWithWhite(colors.brand.default, 0.3),
    highlight: mixWithWhite(colors.brand.default, 0.6),
  },
  remove: {
    default: mixWithWhite(colors.red.default, 0.3),
    highlight: mixWithWhite(colors.red.default, 0.6),
  },
  move: {
    default: mixWithWhite(colors.purple.default, 0.05),
  },
  darkMode: {
    insert: {
      default: darken(colors.brand.default, 30),
      highlight: darken(colors.brand.default, 15),
    },
    remove: {
      default: darken(colors.red.default, 40),
      highlight: darken(colors.red.default, 25),
    },
    move: {
      default: darken(colors.purple.default, 70),
    },
  },
};
