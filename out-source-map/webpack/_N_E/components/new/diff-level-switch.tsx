import * as DiffActions from 'redux/modules/diff-module';
import SegmentedSwitch from 'components/shared/segmented-switch';
import { t } from 'lib/react-tiny-i18n';
import { type DiffLevel } from 'types/normalize';
import { getDiff } from 'redux/selectors/diff-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { type Option } from 'types/option';

const getOptions = (t: (str: string) => string): Array<Option<DiffLevel>> => [
  { value: 'word', label: t('LevelToggle.word') },
  { value: 'character', label: t('LevelToggle.character') },
];

interface DiffLevelSwitchProps {
  disabled?: boolean;
  value?: DiffLevel;
  onClick?: (newDiffLevel: DiffLevel) => void;
  handleChange?: (newDiffLevel: DiffLevel) => void;
}

const DiffLevelSwitch: React.FC<DiffLevelSwitchProps> = ({
  disabled,
  value,
  onClick,
  handleChange,
}) => {
  const dispatch = useAppDispatch();
  const diffLevel = useAppSelector((state) => state.diff.diffLevel);
  const left = useAppSelector((state) => getDiff(state).left);
  const right = useAppSelector((state) => getDiff(state).right);

  const options = getOptions(t);

  handleChange = !!handleChange
    ? handleChange
    : (newDiffLevel: DiffLevel) => {
        if (typeof left !== 'undefined' && typeof right !== 'undefined') {
          dispatch(DiffActions.actions.setDiffLevel(newDiffLevel));
          dispatch(DiffActions.actions.replaceDiff({ left, right }));
        }
      };

  value = value ?? diffLevel;

  const clickLevel = (newDiffLevel: DiffLevel) => {
    if (disabled) {
      return;
    }

    onClick?.(newDiffLevel);

    handleChange(newDiffLevel);
  };

  return (
    <SegmentedSwitch<DiffLevel>
      selectedValue={value}
      options={options}
      onClick={(option) => clickLevel(option.value)}
      disabled={disabled}
    />
  );
};

export default DiffLevelSwitch;
