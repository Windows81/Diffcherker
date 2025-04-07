import { OurPaymentMethod } from 'types/payment-method';
import css from './payment-method-badge.module.css';
import MasterCardSVG from 'static/images/master-card.svg';
import cx from 'classnames';

interface BuyPaymentMethodBadgeProps {
  paymentMethod?: OurPaymentMethod;
  showCardName?: boolean;
}

export const BuyPaymentMethodBadge: React.FC<BuyPaymentMethodBadgeProps> = ({
  paymentMethod,
  showCardName = true,
}) => {
  return (
    <div
      className={cx(
        css.paymentMethodBadge,
        !paymentMethod?.usable && css.expired,
      )}
    >
      <div className={css.ccImg}>
        {paymentMethod ? (
          <img
            alt={`${paymentMethod.cardType} Logo`}
            src={paymentMethod.imageUrl}
            width="48"
          />
        ) : (
          <MasterCardSVG alt={`Master Card Logo`} />
        )}
      </div>

      {paymentMethod ? (
        <div className={css.ccInfo}>
          {paymentMethod.type === 'card' ? (
            <>
              {showCardName && paymentMethod.cardType} ••••{' '}
              {paymentMethod.last4}
              <br />
              {paymentMethod.expirationMonth}/{paymentMethod.expirationYear}
            </>
          ) : (
            <>
              {paymentMethod.cardType}
              <br />
              {paymentMethod.email}
            </>
          )}
        </div>
      ) : (
        <div className={css.ccInfo}>
          <span className="fadded-text">Missing</span>
        </div>
      )}
    </div>
  );
};
