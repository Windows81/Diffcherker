import Router from 'next/router';
import { useEffect } from 'react';

const DesktopPerpetual = () => {
  useEffect(() => {
    Router.push('/desktop');
  }, []);
  return null;
};

export default DesktopPerpetual;
