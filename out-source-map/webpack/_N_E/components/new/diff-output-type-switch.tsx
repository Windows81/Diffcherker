import { type NewOutputType } from 'lib/output-types';
import SegmentedSwitch from 'components/shared/segmented-switch';

interface DiffOutputTypeSwitchProps<T extends string> {
  onTypeChange: (type: T) => void;
  outputTypes: Array<NewOutputType<T>>;
  currentlySelectedType: T;
  vertical?: boolean;
}

const DiffOutputTypeSwitch = <T extends string>({
  onTypeChange,
  outputTypes,
  currentlySelectedType,
  vertical,
}: DiffOutputTypeSwitchProps<T>): JSX.Element => {
  return (
    <SegmentedSwitch
      options={outputTypes.map((outputType) => ({
        value: outputType.name,
        label: outputType.name,
        svg: outputType.icon,
      }))}
      selectedValue={currentlySelectedType}
      onClick={(option) => onTypeChange(option.value)}
      vertical={vertical}
    />
  );
};
export default DiffOutputTypeSwitch;
