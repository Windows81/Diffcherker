import withSession from 'components/with-session';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { createTrial } from 'redux/modules/payments-module';
import { getCurrentUser } from 'redux/modules/user-module';
import { useAppDispatch } from 'redux/store';

const CreateProTrial: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(createTrial())
      .unwrap()
      .then((response) => {
        Tracking.trackEvent('Started trial', {
          source: 'web',
        });
        if (response.chartMogulProfile) {
          Tracking.setUserProperties({
            ChartMogulProfile: `${response.chartMogulProfile['chartmogul-url']}`,
          });
        }
      })
      .then(async () => await dispatch(getCurrentUser()))
      .finally(async () => await router.push('/?pro=true'));
  }, [router, dispatch]);

  return null;
};

export default withSession(CreateProTrial, 'signup-pro-trial');
