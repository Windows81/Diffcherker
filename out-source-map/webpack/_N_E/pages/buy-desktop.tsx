import { useRouter } from 'next/router';
import BuyPage from 'components/buy/buy-page';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import { DESKTOP_MONTHLY_21, DESKTOP_YEARLY_180 } from 'lib/plans';

const BuyDesktop: React.FC = () => {
  const router = useRouter();
  const defaultPlan =
    arrayFirstOrSelf(router.query.term) === 'monthly'
      ? DESKTOP_MONTHLY_21
      : DESKTOP_YEARLY_180;

  return (
    <BuyPage
      pageName="Buy Desktop"
      basePlan={DESKTOP_MONTHLY_21}
      savingPlan={DESKTOP_YEARLY_180}
      defaultPlan={defaultPlan}
      paymentSuccessRoute={'/download-desktop'}
      customHeading="Buy Diffchecker Desktop"
    />
  );
};

export default BuyDesktop;
