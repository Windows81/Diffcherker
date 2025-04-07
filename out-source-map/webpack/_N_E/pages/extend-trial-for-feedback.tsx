import * as React from 'react';
import * as PaymentsActions from 'redux/modules/payments-module';
import Alert from 'components/alert';
import Loading from 'components/loading';
import Page from 'components/page';
import withSession from 'components/with-session';
import Tracking from 'lib/tracking';
import Link from 'next/link';
import { useAppDispatch } from 'redux/store';

const EXTENDING_STATE = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
};

const ExtendTrialForFeedback = () => {
  const dispatch = useAppDispatch();
  const [state, setState] = React.useState(EXTENDING_STATE.LOADING);
  React.useEffect(() => {
    const run = async () => {
      const search = window.location.search;
      if (search) {
        const match = search.match(/extendToken=(.*)/);
        if (match && match.length == 2) {
          const extendToken = match[1];
          try {
            await dispatch(
              PaymentsActions.extendTrialForFeedback(extendToken),
            ).unwrap();
            setState(EXTENDING_STATE.SUCCESS);
            Tracking.trackEvent('Extended feedback', { token: extendToken });
          } catch (error) {
            setState(EXTENDING_STATE.ERROR);
            Tracking.trackEvent('Failed extending feedback', {
              error,
              token: extendToken,
            });
          }
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (state) {
    case EXTENDING_STATE.LOADING:
      return (
        <Page name="Extend trial">
          <Loading message="Your trial is being extended" />
        </Page>
      );
    case EXTENDING_STATE.ERROR:
      return (
        <Page name="Extend trial">
          <Alert type="danger">
            We&apos;re sorry, but we couldn&apos;t extend your trial. Please
            check you&apos;re on the right account and then{' '}
            <Link href="contact">contact us</Link>.
          </Alert>
        </Page>
      );
    case EXTENDING_STATE.SUCCESS:
      return (
        <Page name="Extend trial">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ maxWidth: 600, margin: '100px auto 0 auto' }}>
              Your trial has been extended another 30 days!
            </h2>
            <div>
              <h3>Please open Diffchecker Desktop to continue your trial.</h3>
              <Link href="/account">
                <button className="button" style={{ margin: '15px auto' }}>
                  Go to Account
                </button>
              </Link>
            </div>
          </div>
        </Page>
      );
    default:
      return null;
  }
};

export default withSession(ExtendTrialForFeedback);
