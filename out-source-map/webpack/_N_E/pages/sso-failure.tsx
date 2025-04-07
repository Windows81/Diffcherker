import arrayFirstOrSelf from 'lib/array-first-or-self';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { type ParsedUrlQuery } from 'querystring';
import { useEffect } from 'react';

const errorCodeFromQuery = (query: ParsedUrlQuery): string =>
  arrayFirstOrSelf(query.error) || 'CODE_MISSING';

const trackFailedSso = (query: ParsedUrlQuery): void => {
  const flow = arrayFirstOrSelf(query.flow);
  if (!flow || (flow !== 'login' && flow !== 'signup')) {
    return;
  }
  const kind = arrayFirstOrSelf(query.kind);
  if (!kind || (kind !== 'apple' && kind !== 'google')) {
    return;
  }
  const errorCode = errorCodeFromQuery(query);
  const event = flow === 'login' ? 'Failed logging in' : 'Failed signing up';
  Tracking.trackEvent(event, {
    kind,
    sso: true,
    errorCode,
  });
};

const SsoFailure: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    trackFailedSso(router.query);
    const next = arrayFirstOrSelf(router.query.next) || '/';
    const error = errorCodeFromQuery(router.query);
    const flow = arrayFirstOrSelf(router.query.flow) || 'signup';
    const url = `/${flow}?next=${encodeURIComponent(
      next,
    )}&error=${encodeURIComponent(error)}`;
    router.replace(url);
  }, [router]);

  return null;
};

export default SsoFailure;
