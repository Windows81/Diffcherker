import Alert from 'components/alert';
import Page from 'components/page';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const CliLoginError: React.FC = () => {
  return (
    <Page name="Cli login error">
      <Head>
        <title>{titleTemplate('Cli login error')}</title>
      </Head>
      <Alert type="danger">
        We are sorry, but something went wrong when logging in to the
        Diffchecker CLI. Please <Link href="/contact">contact us</Link> and try
        again later.
      </Alert>
    </Page>
  );
};

export default CliLoginError;
