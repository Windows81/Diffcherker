import * as React from 'react';
import css from './mockup.module.css';
import cx from 'classnames';
import ImageRetina from 'components/imageRetina';

interface MockupProps {
  type: string;
  showMenubar?: boolean;
}

const Mockup = ({ type, showMenubar }: MockupProps): JSX.Element => {
  const [mockupWithMenubar, setMockupWithMenubar] = React.useState('');

  React.useEffect(() => {
    // check if component is already mounted in the browser
    const isMount = typeof window !== 'undefined' && navigator;

    if (isMount) {
      // determine if using an Apple device, otherwise use Windows mockup
      const platformImage = /Mac|iPhone|iPod|iPad/.test(navigator.platform)
        ? `mockups/${type}-mac`
        : `mockups/${type}-windows`;
      setMockupWithMenubar(platformImage);
    }
  }, [type]);

  return (
    <div className={cx(type === 'darkmode' && css.dark, css.wrapper)}>
      <div className={css.shell}>
        <ImageRetina
          format="webp"
          src={showMenubar ? mockupWithMenubar : `mockups/${type}`}
          alt="Diffchecker interface screenshot"
        />
      </div>
    </div>
  );
};

export default Mockup;
