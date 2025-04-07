import { OurPaymentMethod } from 'types/payment-method';
import css from './button.module.css';
import { BuyPaymentMethodBadge } from '../payment-method-badge';
import Button from 'components/shared/button';
import cx from 'classnames';
import OkCircleSvg from 'components/shared/icons/ok-circle.svg';
import Icon from 'components/shared/icon';
interface BuyPaymentMethodButtonProps {
  isSelected?: boolean;
  paymentMethod: OurPaymentMethod;
  showCardName?: boolean;
  onClick?: (paymentMethod: OurPaymentMethod) => Promise<void> | void;
}

export const BuyPaymentMethodButton: React.FC<
  BuyPaymentMethodButtonProps
  // eslint-disable-next-line @typescript-eslint/no-empty-function
> = ({
  paymentMethod,
  isSelected = false,
  showCardName,
  onClick = () => {
    /* noop */
  },
}) => {
  return (
    <Button
      style="basic"
      className={cx(css.selector, isSelected && css.selected)}
      onClick={() => onClick(paymentMethod)}
      disabled={!paymentMethod.usable}
      tabIndex={-1}
    >
      <BuyPaymentMethodBadge
        paymentMethod={paymentMethod}
        showCardName={showCardName}
      />
      {isSelected && <Icon svg={OkCircleSvg} size="xl" />}
    </Button>
  );
};
