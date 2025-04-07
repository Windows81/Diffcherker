import MessageBanner from 'components/shared/message-banner';
import css from './color-primitives.module.css';

const Colors = {
  tones: ['grey', 'green', 'yellow', 'orange', 'red', 'purple', 'blue'],
  values: Array.from({ length: 9 }, (_, i) => (i + 1) * 100),
};

const getCssVariableName = (tone: string, value: number) =>
  `var(--colors-${tone}-${value})`;

interface ColorPrimitiveProps {
  tone: string;
  value: number;
}

const ColorPrimitive: React.FC<ColorPrimitiveProps> = ({ tone, value }) => {
  return (
    <div
      className={css.color}
      style={
        {
          color: value < 600 ? 'black' : 'white',
          backgroundColor: getCssVariableName(tone, value),
        } as React.CSSProperties
      }
    >
      <span>
        {tone}/{value}
      </span>
    </div>
  );
};

const ColorPrimitives: React.FC = () => {
  return (
    <div className={css.wrapper}>
      <MessageBanner
        type="userError"
        title="Note: Do not use the color primitives below directly!"
        message="Instead, used themed tokens so light and dark mode are both covered."
      />

      <div className={css.colors}>
        {Colors.tones.map((tone) => (
          <>
            {Colors.values.map((value) => (
              <ColorPrimitive key={tone + value} tone={tone} value={value} />
            ))}
          </>
        ))}
      </div>
    </div>
  );
};

export default ColorPrimitives;
