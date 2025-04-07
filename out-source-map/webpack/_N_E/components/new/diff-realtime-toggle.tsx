import * as AppActions from 'redux/modules/app-module';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { type DiffVersion } from 'types/diffVersion';

import DiffToggle from './diff-toggle';

interface DiffRealtimeToggleProps {
  value?: DiffVersion;
  onClick?: (newDiffVersion: DiffVersion) => void;
  handleChange?: (newDiffVersion: DiffVersion) => void;
  checkIfAllowed?: () => boolean;
  disabled?: boolean;
}

const DiffRealtimeToggle: React.FC<DiffRealtimeToggleProps> = ({
  value,
  onClick,
  handleChange,
  checkIfAllowed,
  disabled,
}) => {
  const diffVersion = useAppSelector((state) => state.app.diffVersion);
  const dispatch = useAppDispatch();

  value = value ?? diffVersion;

  handleChange = !!handleChange
    ? handleChange
    : (newDiffVersion: DiffVersion) => {
        dispatch(AppActions.actions.setDiffVersion(newDiffVersion));
      };

  return (
    <DiffToggle<DiffVersion>
      label="Real-time diff"
      currentValue={value}
      onValue="live"
      offValue="regular"
      disabled={disabled}
      onClick={onClick}
      handleChange={handleChange}
      checkIfAllowed={checkIfAllowed}
    />
  );
};

export default DiffRealtimeToggle;
