import * as React from 'react';
import * as LicenseActions from 'redux/modules/license-module';
import BillingToggle from 'components/buy/billing-toggle';
import FaqList from 'components/content-pages/faq-list';
import Page from 'components/new/page';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppDispatch } from 'redux/store';
import css from './pricing.module.css';
import cx from 'classnames';
import Plans from 'components/content-pages/plans';
import PricingTable from 'components/content-pages/pricing-table';
import Marquee from 'components/brands-marquee';
import Callout from 'components/content-pages/callout';

const Pricing: React.FC = () => {
  const dispatch = useAppDispatch();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    dispatch(LicenseActions.getMyLicense());
  }, [dispatch]);
  const title = `Pricing - Diffchecker Desktop`;

  return (
    <Page name="Diffchecker - Pricing" fullWidth>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={`Get Diffchecker Pro + Desktop for as low as $15/user/month or Enterpise for $40/user/month. Compare plans to see what works best.`}
        />
      </Head>

      <main className={css.main}>
        <section className={cx(css.section, css.headerSection)}>
          <h1 className={css.headingLarge}>Pricing</h1>
          <p className={cx(css.paragraph, css.headerSectionParagraph)}>
            Diffchecker is free forever without limits. Upgrade to secure
            offline mode, enhanced security, and additional features.
          </p>
          <BillingToggle
            onChange={(billing) => {
              setBilling(billing);
            }}
            billing={billing}
          />
          <Plans billing={billing} />
          <Callout
            title="Diffchecker API Plans"
            description="Connect to our HTTP endpoints and use Diffchecker's diffing engine in your own applications."
            buttonLabel="Check out the Diffchecker API"
            buttonHref="/public-api"
          />
        </section>
        <section className={cx(css.section, css.logosSection)}>
          <h2 className={css.label}>
            Trusted by the world&apos;s top companies
          </h2>
          <Marquee />
        </section>
        <section className={css.section}>
          <PricingTable billing={billing} />
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
};
export default Pricing;
