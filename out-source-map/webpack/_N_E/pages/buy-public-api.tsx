import BuyPage from 'components/buy/buy-page';
import { apiPlans } from 'lib/plans';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const BuyPublicApi: React.FC = () => {
  const router = useRouter();
  const planId = arrayFirstOrSelf(router.query.planId);
  const apiPlan = planId !== undefined && apiPlans.find((p) => p.id === planId);

  useEffect(() => {
    if (!apiPlan) {
      router.push('/');
    }
  }, [apiPlan, router]);

  if (!apiPlan) {
    return null;
  }

  return (
    <BuyPage
      pageName="Buy API"
      customHeading="Buy Diffchecker API"
      homeRedirect={'/public-api'}
      basePlan={apiPlan}
      paymentSuccessRoute={'/buy-public-api-success'}
    />
  );
};

export default BuyPublicApi;
