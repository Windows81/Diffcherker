import { useRouter } from 'next/router';
import React, { type ComponentType, type ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentUser } from 'redux/modules/user-module';
import { getSessionStatus } from 'redux/selectors/user-selector';
import { useAppDispatch } from 'redux/store';

const Loading = () => <p>Loading...</p>;

export default function withSession<T extends object>(
  Component: ComponentType<T>,
  formPath?: string,
): ComponentType<T> {
  const WrappedComponent = (props: T): ReactElement => {
    const sessionStatus = useSelector(getSessionStatus);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const forceSignup = router.query.signup === 'true';
    const path = formPath || (forceSignup ? 'signup' : 'login');

    useEffect(() => {
      if (sessionStatus !== 'to be determined') {
        return;
      }
      dispatch(getCurrentUser());
    }, [dispatch, sessionStatus]);

    if (sessionStatus === 'to be determined') {
      return <Loading />;
    }

    if (sessionStatus === 'present') {
      return <Component {...props} />;
    }

    if (typeof window !== 'undefined') {
      router.push(`/${path}?next=${encodeURIComponent(router.asPath)}`);
    }

    return <Loading />;
  };

  return WrappedComponent;
}
