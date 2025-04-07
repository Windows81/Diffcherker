import Page from 'components/page';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

const BuyPublicApiSuccess = (): JSX.Element => {
  return (
    <Page name="Buy public api success">
      <Head>
        <title>{titleTemplate('Buy public api success')}</title>
      </Head>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ maxWidth: 600, margin: '100px auto 0 auto' }}>
          Thank you for purchasing Diffchecker API!
        </h2>
        <p>
          You can find your API Key in the{' '}
          <Link href="/account">Account section</Link>. Please refer to{' '}
          <Link href="/public-api">API Documentation</Link> on instructions how
          to use it.
        </p>
      </div>
    </Page>
  );
};

export default BuyPublicApiSuccess;
