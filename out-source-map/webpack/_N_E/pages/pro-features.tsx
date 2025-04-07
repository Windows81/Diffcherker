import * as React from 'react';
import Page from 'components/new/page';
import css from './desktop.module.css';
import cx from 'classnames';

import Cta from 'components/content-pages/cta';
import Marquee from 'components/brands-marquee';
import Mockup from 'components/content-pages/mockup';
import GridItem from 'components/content-pages/grid-item';
import FaqList from 'components/content-pages/faq-list';
import Features from 'components/content-pages/features';
import Logo from 'components/content-pages/logo';

const Pro = (): JSX.Element => {
  return (
    <Page
      name="Diffchecker Pro"
      title="Web and desktop file comparison - Diffchecker Pro"
      metaDescription="Diffchecker Pro enables you to compare text, images, PDFs, spreadsheets, and folders, on your desktop or directly in the browser."
      fullWidth
    >
      <main className={css.main}>
        <section className={cx(css.section, css.hero, css.gradientBackground)}>
          <Logo label="Pro" isLabelGreen={false} />
          <h1 className={css.headingLarge}>
            The most popular file comparison tool on the web — now Pro
          </h1>
          <p className={cx(css.paragraph, css.heroParagraphLarge)}>
            With Diffchecker Pro, you can spot differences between text, images,
            files, and folders — with ultimate precision.
          </p>
          <Cta showPricing position="pro-hero" url="/signup-pro-trial" />
        </section>

        <section className={cx(css.section, css.logos)}>
          <h2 className={css.label}>
            Trusted by the world&apos;s top companies
          </h2>
          <Marquee />
        </section>

        <section className={cx(css.section, css.grid)}>
          <GridItem size={2}>
            <Mockup type="text" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>
                Compare text with total precision
              </h2>
              <p className={css.paragraph}>
                Instantly compare any text files, whether it&apos;s code, legal
                documents, or your favorite sourdough recipes. Check differences
                by word or character and make real-time edits
              </p>
            </div>
          </GridItem>
          <GridItem size={2}>
            <Mockup type="document" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>
                Compare Word and PDF documents
              </h2>
              <p className={css.paragraph} style={{ alignSelf: 'flex-start' }}>
                Use our AI software to extract and compare content from two
                PDFs, or merge files to highlight graphic differences
              </p>
            </div>
          </GridItem>
          <GridItem size={1}>
            <Mockup type="image-small" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>Compare images</h2>
              <p className={css.paragraph}>
                Slide to compare images pixel by pixel or seamlessly fade and
                overlay two pictures for a clear result
              </p>
            </div>
          </GridItem>
          <GridItem size={1}>
            <Mockup type="excel" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>Compare spreadsheets</h2>
              <p className={css.paragraph}>
                Scan through each cell like an X-ray or display files side by
                side for a detailed overview of your data
              </p>
            </div>
          </GridItem>
        </section>

        <section
          className={cx(
            css.section,
            css.gradientBackground,
            css.gradientBackgroundMockup,
          )}
        >
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Quickly compare and merge</h2>
            <p className={css.paragraph}>
              Review and combine modified sections of your documents for a
              smooth and precise export.
            </p>
          </div>
          <Mockup type="merge" />
        </section>

        <section
          className={cx(
            css.section,
            css.gradientBackground,
            css.gradientBackgroundMockup,
          )}
        >
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Explain comparisons with AI</h2>
            <p className={css.paragraph}>
              Let AI do the heavy lifting and explain the most complex diffs to
              you in plain English.
            </p>
          </div>
          <Mockup type="ai" />
        </section>

        <section
          className={cx(
            css.section,
            css.gradientBackground,
            css.gradientBackgroundMockup,
          )}
        >
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Edit differences in real time</h2>
            <p className={css.paragraph}>
              Modify your diffs on the fly with our built-in text editor and
              compute the differences in real-time.
            </p>
          </div>
          <video className={css.video} controls autoPlay loop muted>
            <source
              src="/static/videos/realtime-diff-new.webm"
              type="video/webm"
            />
            <source
              src="/static/videos/realtime-diff-new.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </section>

        <section className={cx(css.section, css.features)}>
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Do more with Diffchecker Pro</h2>
            <p className={css.paragraph}>
              Your all-in-one comparison powerhouse, with over 30+ features for
              a faster, easier workflow.
            </p>
          </div>
          <Features />
        </section>

        <section
          className={cx(
            css.section,
            css.gradientBackground,
            css.gradientBackgroundMockup,
          )}
        >
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Collaborate securely</h2>
            <p className={css.paragraph}>
              Make your documents accessible to the public or share privately
              with end-to-end encryption.
            </p>
          </div>
          <Mockup type="sharing" />
        </section>

        <section
          className={cx(
            css.section,
            css.gradientBackground,
            css.gradientBackgroundMockup,
          )}
        >
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Annotate and collect feedback</h2>
            <p className={css.paragraph}>
              Add and gather comments on each line and change of the document.
            </p>
          </div>
          <Mockup type="comments" />
        </section>

        <section className={cx(css.section, css.faq)}>
          <h2 className={css.headingSmall}>Frequently Asked Questions</h2>
          <FaqList />
        </section>

        <section
          className={cx(
            css.section,
            css.bottom,
            css.gradientBackground,
            css.gradientBackgroundCTA,
          )}
        >
          <h1 className={css.heading}>Get Diffchecker Pro</h1>
          <Cta position="pro-footer" url="/signup-pro-trial" />
        </section>
      </main>
    </Page>
  );
};
export default Pro;
