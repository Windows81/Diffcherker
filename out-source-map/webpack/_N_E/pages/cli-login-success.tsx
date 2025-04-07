import Alert from 'components/alert';
import Page from 'components/page';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import React from 'react';

const CliLoginSuccess: React.FC = () => {
  return (
    <Page name="Cli login success">
      <Head>
        <title>{titleTemplate('Cli login success')}</title>
      </Head>
      <Alert type="success">
        You are successfully logged in to Diffchecker CLI - you can close this
        page now.
      </Alert>
    </Page>
  );
};

export default CliLoginSuccess;
