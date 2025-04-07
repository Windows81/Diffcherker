import * as React from 'react';
import Page from 'components/new/page';
import Head from 'next/head';
import Link from 'next/link';
import css from './pricing.module.css';
import cx from 'classnames';
import Callout from 'components/content-pages/callout';
import Marquee from 'components/brands-marquee';
import FaqList from 'components/content-pages/faq-list';
import ApiTable from 'components/content-pages/api-table';

export default function PublicAPI() {
  return (
    <Page name="Diffchecker API" fullWidth>
      <Head>
        <title>Diffchecker API</title>
        <meta
          name="description"
          content="Use the Diffchecker Diff API to compare text, images, and PDF files in your applications."
        />
      </Head>

      <main className={css.main}>
        <section className={cx(css.section, css.headerSection)}>
          <h1 className={css.headingLarge}>Diffchecker API</h1>
          <p className={cx(css.paragraph, css.headerSectionParagraph)}>
            Use the Diffchecker Diff API to compare text, images, and PDF files
            in your applications.
          </p>
        </section>
        <section className={css.section}>
          <ApiTable />
          <Callout
            title="Diffchecker API Docs"
            description="To learn how to use Diffchecker API in your own projects, check out Diffchecker API Docs."
            buttonLabel="Go to docs"
            buttonHref="/docs/getting-started"
          />
        </section>
        <section className={cx(css.section, css.logosSection)}>
          <h2 className={css.label}>
            Trusted by the world&apos;s top companies
          </h2>
          <Marquee />
        </section>
        <section>
          <div className={cx(css.section, css.faqSection)}>
            <h2 className={css.headingSmall}>Frequently Asked Questions</h2>
            <FaqList />
            <p className={css.paragraphSmall}>
              <span>Have more questions? </span>
              <Link className={css.link} href="/contact">
                Contact us
              </Link>
            </p>
          </div>
        </section>
      </main>
    </Page>
  );
}
