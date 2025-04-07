import * as AppActions from 'redux/modules/app-module';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { type DiffCompression } from 'types/diffCompression';

import DiffToggle from './diff-toggle';

interface DiffCollapsedToggleProps {
  value?: DiffCompression;
  onClick?: (newDiffCompression: DiffCompression) => void;
  handleChange?: (newDiffCompression: DiffCompression) => void;
  checkIfAllowed?: () => boolean;
  disabled?: boolean;
}

const DiffCollapsedToggle: React.FC<DiffCollapsedToggleProps> = ({
  value,
  onClick,
  handleChange,
  checkIfAllowed,
  disabled,
}) => {
  const diffCompression = useAppSelector((state) => state.app.diffCompression);
  const left = useAppSelector((state) => getDiff(state).left);
  const right = useAppSelector((state) => getDiff(state).right);

  value = value ?? diffCompression;

  const dispatch = useAppDispatch();

  handleChange = !!handleChange
    ? handleChange
    : (newDiffCompression: DiffCompression) => {
        if (typeof left !== 'undefined' && typeof right !== 'undefined') {
          dispatch(AppActions.actions.setDiffCompression(newDiffCompression));
        }
      };

  return (
    <DiffToggle<DiffCompression>
      label="Collapse lines"
      currentValue={value}
      onValue="collapsed"
      offValue="expanded"
      disabled={disabled}
      onClick={onClick}
      handleChange={handleChange}
      checkIfAllowed={checkIfAllowed}
    />
  );
};

export default DiffCollapsedToggle;
