import DownloadDiffchecker from 'components/download-diffchecker';
import Page from 'components/new/page';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import React from 'react';

const DownloadDiffcheckerPage = (): JSX.Element => {
  return (
    <Page name="Download Diffchecker Desktop" fullWidth>
      <Head>
        <title>{titleTemplate('Download Diffchecker Desktop')}</title>
      </Head>
      <DownloadDiffchecker />
    </Page>
  );
};

export default DownloadDiffcheckerPage;
