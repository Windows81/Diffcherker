import * as UserActions from 'redux/modules/user-module';
import 'react-redux';
import { type DiffType } from 'redux/modules/user-module';
import { useAppDispatch, useAppSelector } from 'redux/store';

import DiffToggle from './diff-toggle';

interface DiffUnifiedToggleProps {
  value?: DiffType;
  onClick?: (newDiffType: DiffType) => void;
  handleChange?: (newDiffType: DiffType) => void;
  checkIfAllowed?: () => boolean;
  disabled?: boolean;
}

const DiffUnifiedToggle: React.FC<DiffUnifiedToggleProps> = ({
  value,
  onClick,
  handleChange,
  checkIfAllowed,
  disabled,
}) => {
  const diffType = useAppSelector((state) => state.user.diffType);
  const dispatch = useAppDispatch();

  value = value ?? diffType;

  handleChange = !!handleChange
    ? handleChange
    : (newDiffType: DiffType) => {
        dispatch(UserActions.actions.setDiffType(newDiffType));
      };

  return (
    <DiffToggle<DiffType>
      label="Unified diff"
      currentValue={value}
      onValue="unified"
      offValue="split"
      disabled={disabled}
      onClick={onClick}
      handleChange={handleChange}
      checkIfAllowed={checkIfAllowed}
    />
  );
};

export default DiffUnifiedToggle;
