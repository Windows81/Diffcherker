import * as React from 'react';
import Button from 'components/shared/button';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';

const ActionsBasic = (): JSX.Element => {
  const hasLicense = useSelector((state: State) => !!state.user.user?.license);

  return (
    <Button style="secondary" tone="base" size="large" fullWidth disabled>
      {hasLicense ? 'The default plan' : 'Your current plan'}
    </Button>
  );
};

export default ActionsBasic;
