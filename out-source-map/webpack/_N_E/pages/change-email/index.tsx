import * as UserActions from 'redux/modules/user-module';
import Alert from 'components/alert';
import ErrorBar from 'components/error-bar';
import Floating from 'components/floating';
import Loading from 'components/loading';
import Page from 'components/page';
import withSession from 'components/with-session';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useAppDispatch } from 'redux/store';

type Status =
  | { type: 'loading' }
  | { type: 'success' }
  | { type: 'error'; code: string };

const SUCCESS_REDIRECT_TIMEOUT = 3000;

const ChangeEmail: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<Status>({ type: 'loading' });

  useEffect(() => {
    const code = arrayFirstOrSelf(router.query.code);
    if (!code) {
      router.push('/');
      return;
    }
    dispatch(UserActions.confirmChangeEmail(code))
      .unwrap()
      .then(() => {
        setStatus({ type: 'success' });
        setTimeout(
          async () => await router.push('/'),
          SUCCESS_REDIRECT_TIMEOUT,
        );
      })
      .catch((error) => setStatus({ type: 'error', code: error.code }));
  }, [dispatch, router]);

  return (
    <Page name="Change Email">
      <Head>
        <title>{titleTemplate('Change Email')}</title>
      </Head>
      <Floating>
        {status.type === 'loading' && <Loading />}
        {status.type === 'success' && (
          <Alert type="success">
            Successfully changed email address - you are being redirected to
            home page.
          </Alert>
        )}
        {status.type === 'error' && (
          <>
            <h2 className="error-title">Email change failed</h2>
            <ErrorBar code={status.code} />
          </>
        )}
      </Floating>
      <style>{`
        .error-title {
          padding-left: 15px;
        }
      `}</style>
    </Page>
  );
};

export default withSession(ChangeEmail);
