/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { memo } from 'react';
import css from './color-chips.module.css';
import cx from 'classnames';

const BackgroundColors = {
  base: {
    primary: ['default', 'hover', 'active', 'default alt'],
    secondary: ['default', 'hover', 'active', 'default alt'],
    tertiary: ['default', 'hover', 'active', 'default alt'],
    inverse: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  green: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  yellow: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  orange: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  red: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  purple: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
  blue: {
    primary: ['default', 'hover', 'active'],
    secondary: ['default', 'hover', 'active'],
    tint: ['default', 'hover', 'active', 'highlight'],
  },
};

const TextColors = {
  base: ['primary', 'secondary', 'placeholder'],
  inverse: ['primary', 'secondary'],
  green: ['primary', 'secondary'],
  yellow: ['primary', 'secondary'],
  orange: ['primary', 'secondary'],
  red: ['primary', 'secondary'],
  purple: ['primary', 'secondary'],
  blue: ['primary', 'secondary'],
};

const BorderColors = {
  base: ['primary', 'secondary', 'tertiary'],
  green: ['primary', 'secondary'],
  yellow: ['primary', 'secondary'],
  orange: ['primary', 'secondary'],
  red: ['primary', 'secondary'],
  purple: ['primary', 'secondary'],
  blue: ['primary', 'secondary'],
};

const IconColors = {
  base: ['primary', 'inverse'],
  green: ['primary', 'inverse'],
  yellow: ['primary', 'inverse'],
  orange: ['primary', 'inverse'],
  red: ['primary', 'inverse'],
  purple: ['primary', 'inverse'],
  blue: ['primary', 'inverse'],
};

const getCssVariableName = (words: string[]) =>
  `var(--theme-colors-${words.join('-').replace(' ', '-')})`;

const getCssGridColumns = (
  options:
    | {
        chip: 'simple';
        tones: SimpleChipSectionProps['tones'];
      }
    | {
        chip: 'nested';
        tones: NestedChipSectionProps['tones'];
      },
) => {
  let arrayOfArrays: string[][];

  if (options.chip === 'simple') {
    arrayOfArrays = Object.values(options.tones);
  } else {
    arrayOfArrays = Object.values(options.tones)
      .map((obj) => Object.values(obj))
      .flat(1);
  }

  const numColumns = Math.max(...arrayOfArrays.map((array) => array.length));
  return {
    '--grid-columns': `repeat(${numColumns}, minmax(0, 245px))`,
  } as React.CSSProperties;
};

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

interface BaseChipProps {
  tone: string;
  type: string;
  gridPlacement?: {
    row: number;
    column: number;
  };
}

type NestedChipProps = BaseChipProps & {
  style: 'background';
  state: string;
};

type SimpleChipProps = BaseChipProps & {
  style: 'text' | 'border' | 'icon';
  state?: undefined;
};

type ChipProps = NestedChipProps | SimpleChipProps;

const Chip: React.FC<ChipProps> = ({
  style,
  tone,
  type,
  state,
  gridPlacement,
}) => {
  const wordsForVariable = [style, tone, type];

  if (state) {
    wordsForVariable.push(state);
  }

  const cssVariable = getCssVariableName(wordsForVariable);

  const cssStyles: Record<string, string> = {
    '--chip-color': cssVariable,
  };

  if (gridPlacement) {
    cssStyles.gridArea = `${gridPlacement.row + 1} / ${gridPlacement.column + 1}`;
  }

  if (style === 'icon' && type === 'inverse') {
    cssStyles['--extra-color'] = getCssVariableName([
      'background',
      tone,
      tone === 'base' ? 'inverse' : 'primary',
      'default',
    ]);
  } else if (style === 'text' && tone === 'inverse') {
    cssStyles['--extra-color'] = getCssVariableName([
      'background',
      'base',
      'inverse',
      'default',
    ]);
  } else if (style === 'text' && tone !== 'base') {
    cssStyles['--extra-color'] = getCssVariableName([
      'background',
      tone,
      'secondary',
      'default',
    ]);
  }

  return (
    <div
      className={cx(css.chip, css[style])}
      style={cssStyles as React.CSSProperties}
      onClick={() => {
        navigator.clipboard.writeText(cssVariable);
      }}
    >
      <div className={css.visualContent}>
        {style === 'icon' && (
          <svg
            width="39"
            height="39"
            viewBox="0 0.5 39 39.5"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 4.5a4 4 0 0 1 4-4h21a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-21Z" />
            <path
              opacity=".4"
              d="M10 14.5a4 4 0 0 1 4-4h21a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4v-21Z"
            />
          </svg>
        )}
      </div>
      <div className={css.bottomContent}>
        <div className={css.textContent}>
          <div className={css.textType}>{capitalize(type)}</div>
          <div className={css.textState}>{state}</div>
        </div>
      </div>
    </div>
  );
};

interface SimpleChipSectionProps {
  style: SimpleChipProps['style'];
  tones: Record<string, string[]>;
}

const SimpleChipSection: React.FC<SimpleChipSectionProps> = ({
  style,
  tones,
}) => {
  return (
    <div
      className={css.sectionWrapper}
      style={getCssGridColumns({ tones, chip: 'simple' })}
    >
      <div className={css.sectionTitle}>{capitalize(style)}</div>
      {Object.entries(tones).map(([tone, typeArray]) => {
        return (
          <div key={`${style} ${tone}`} className={css.toneWrapper}>
            <div className={css.toneTitle}>{capitalize(tone)}</div>
            <div className={css.toneContainer}>
              {typeArray.map((type) => (
                <Chip
                  key={`${style} ${tone} ${type}`}
                  style={style}
                  tone={tone}
                  type={type}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface NestedChipSectionProps {
  style: NestedChipProps['style'];
  tones: Record<string, Record<string, string[]>>;
}

const NestedChipSection: React.FC<NestedChipSectionProps> = ({
  style,
  tones,
}) => {
  return (
    <div
      className={css.sectionWrapper}
      style={getCssGridColumns({ tones, chip: 'nested' })}
    >
      <div className={css.sectionTitle}>{capitalize(style)}</div>
      {Object.entries(tones).map(([tone, typeObj]) => {
        return (
          <div key={`${style} ${tone}`} className={css.toneWrapper}>
            <div className={css.toneTitle}>{capitalize(tone)}</div>
            <div className={css.toneContainer}>
              {Object.entries(typeObj).map(([type, stateArray], row) => {
                return stateArray.map((state, column) => (
                  <Chip
                    key={`bg ${tone} ${type} ${state}`}
                    style="background"
                    tone={tone}
                    type={type}
                    state={state}
                    gridPlacement={{ row, column }}
                  />
                ));
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const BackgroundColorChips: React.FC = memo(
  function BackgroundColorChips() {
    return <NestedChipSection style="background" tones={BackgroundColors} />;
  },
);

export const TextColorChips: React.FC = memo(function TextColorChips() {
  return <SimpleChipSection style="text" tones={TextColors} />;
});

export const BorderColorChips: React.FC = memo(function BorderColorChips() {
  return <SimpleChipSection style="border" tones={BorderColors} />;
});

export const IconColorChips: React.FC = memo(function IconColorChips() {
  return <SimpleChipSection style="icon" tones={IconColors} />;
});

const Chips = {
  background: BackgroundColorChips,
  text: TextColorChips,
  border: BorderColorChips,
  icon: IconColorChips,
};

interface ColorChipsProps {
  category?: 'all' | 'background' | 'text' | 'border' | 'icon';
}

const ColorChips: React.FC<ColorChipsProps> = ({ category = 'all' }) => {
  if (category === 'all') {
    return (
      <div className={css.all}>
        {Object.entries(Chips).map(([key, Component]) => (
          <Component key={key} />
        ))}
      </div>
    );
  }

  const Component = Chips[category];
  return <Component />;
};

export default ColorChips;
