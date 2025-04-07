import DownloadDiffchecker from 'components/download-diffchecker';
import Page from 'components/new/page';

import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import React from 'react';

const DownloadTrial = (): JSX.Element => {
  return (
    <Page name="Download Desktop" fullWidth>
      <Head>
        <title>{titleTemplate('Download Diffchecker Desktop')}</title>
      </Head>
      <DownloadDiffchecker />
    </Page>
  );
};

export default DownloadTrial;
