import Button, { ButtonProps } from 'components/shared/button';
import { DistributiveOmit } from 'react-redux';

type IconButtonProps = DistributiveOmit<
  Exclude<ButtonProps, { style: 'clean' }>, // just use a clean button and place the icon in the children yourself if you want clean
  'iconStartSvg' | 'iconEndSvg' | 'badge' | 'fullWidth'
> & {
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
};

const IconButton: React.FC<IconButtonProps> = ({ svg, ...props }) => {
  // eslint-disable-next-line react/no-children-prop
  return <Button iconStartSvg={svg} {...props} children={undefined} />; // children can be passed despite not being in types and we don't want that
};

export default IconButton;
