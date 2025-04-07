import BuyPage from 'components/buy/buy-page';
import { ENTERPRISE_YEARLY } from 'lib/plans';

const BuyEnterprise: React.FC = () => {
  return (
    <BuyPage
      pageName="Buy Enterprise"
      basePlan={ENTERPRISE_YEARLY}
      paymentSuccessRoute={'/account/organization'}
    />
  );
};

export default BuyEnterprise;
