import css from './dropzone-input-instruction.module.css';
import Icon from 'components/shared/icon';

interface DropzoneInputInstructionProps {
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
  instruction: string;
  subInstruction: string;
}

const DropzoneInputInstruction: React.FC<DropzoneInputInstructionProps> = ({
  svg,
  instruction,
  subInstruction,
}) => {
  return (
    <div className={css.inputInstruction}>
      <Icon size="xl" svg={svg} />
      <div className={css.text}>
        <div className={css.instruction}>{instruction}</div>
        <div>{subInstruction}</div>
      </div>
    </div>
  );
};
export default DropzoneInputInstruction;
