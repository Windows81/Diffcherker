import ColorChips from 'components/storybook/color-chips';
import Button from 'components/shared/button';
import ColorPrimitives from 'components/storybook/color-primitives';

const Colors: React.FC = () => {
  return (
    <div
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 50,
      }}
    >
      <Button
        style="primary"
        tone="green"
        size="xl"
        onClick={() => {
          if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
          } else {
            document.documentElement.classList.add('dark');
          }
        }}
      >
        Toggle dark mode
      </Button>

      <ColorChips />
      <ColorPrimitives />
    </div>
  );
};

export default Colors;
