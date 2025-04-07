import Router from 'next/router';
import { useEffect } from 'react';

const DesktopLicense = () => {
  useEffect(() => {
    Router.push('/desktop');
  }, []);
  return null;
};

export default DesktopLicense;
