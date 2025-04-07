import OkSvg from 'components/shared/icons/ok.svg';
import css from './modal-desktop-features.module.css';
import Icon from 'components/shared/icon';

const points = [
  'Advanced text diff tools',
  'Real-time text diffs',
  'No ads',
  'The best security',
  'Compare folders',
  'Offline mode',
];

const ModalDesktopFeatures: React.FC = () => {
  return (
    <ul className={css.container}>
      {points.map((point, index) => (
        <li key={index}>
          <Icon svg={OkSvg} />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
};

export default ModalDesktopFeatures;
