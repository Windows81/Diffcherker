import arrayFirstOrSelf from 'lib/array-first-or-self';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { type ParsedUrlQuery } from 'querystring';
import { useEffect } from 'react';

const trackSuccessfulSso = (query: ParsedUrlQuery): void => {
  const id = arrayFirstOrSelf(query.id);
  if (!id) {
    return;
  }
  const signup = arrayFirstOrSelf(query.signup);
  if (!signup || (signup !== 'true' && signup !== 'false')) {
    return;
  }
  const flow = arrayFirstOrSelf(query.flow);
  if (!flow || (flow !== 'login' && flow !== 'signup')) {
    return;
  }
  const kind = arrayFirstOrSelf(query.kind);
  if (!kind || (kind !== 'apple' && kind !== 'google')) {
    return;
  }
  const event = signup === 'true' ? 'Signed up' : 'Logged in';
  const chartMogulUUID = arrayFirstOrSelf(query.chartMogulUUID);
  Tracking.setUserId(Number(id));
  if (chartMogulUUID) {
    Tracking.setUserProperties({
      ChartMogulProfile: `https://app.chartmogul.com/#/customers/${chartMogulUUID}`,
    });
  }
  Tracking.trackEvent(event, {
    kind,
    sso: true,
    id,
    flow,
  });
};

const SsoSuccess: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    trackSuccessfulSso(router.query);
    const next = arrayFirstOrSelf(router.query.next);
    router.replace(
      next || `/${router.query.signup === 'true' ? '?signedup=true' : ''}`,
    );
  }, [router]);

  return null;
};

export default SsoSuccess;
