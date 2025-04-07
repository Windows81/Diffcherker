import * as React from 'react';
import Marquee from 'components/brands-marquee';
import Page from 'components/new/page';
import css from './desktop.module.css';
import cx from 'classnames';
import Mockup from 'components/content-pages/mockup';
import Cta from 'components/content-pages/cta';
import Logo from 'components/content-pages/logo';
import Security from 'components/content-pages/security';
import Features from 'components/content-pages/features';
import GridItem from 'components/content-pages/grid-item';
import FaqList from 'components/content-pages/faq-list';

const NewDesktop: React.FC = () => {
  const title = `Diff tool for Windows, Mac, and Linux file comparison - Diffchecker Desktop`;
  return (
    <Page
      name="Diffchecker Desktop"
      title={title}
      metaDescription="Diffchecker Desktop - Diff tool for Windows, Mac, and Linux. Bring a powerful text, image and file comparison app to your desktop."
      fullWidth
    >
      <main className={css.main}>
        <section className={cx(css.section, css.hero, css.gradientBackground)}>
          <Logo label="Desktop" isLabelGreen />
          <h1 className={css.headingLarge}>
            Discover the power of offline security
          </h1>
          <p className={cx(css.paragraph, css.heroParagraph)}>
            Safely compare text, images, and files offline — on Windows, macOS,
            and Linux.
          </p>
          <Cta url="/download-trial" showPricing position="desktop-hero" />
        </section>

        <section className={cx(css.section, css.logos)}>
          <h2 className={css.label}>
            Trusted by the world&apos;s top companies
          </h2>
          <Marquee />
        </section>

        <Mockup type="text" showMenubar />

        <section className={cx(css.sectionDarkWrapper, css.gradientBackground)}>
          <div className={cx(css.section, css.security)}>
            <div className={css.sectionHeader}>
              <h2 className={css.heading}>
                Protect your confidential documents
              </h2>
              <p className={cx(css.paragraph, css.securityParagraph)}>
                Using Diffchecker Desktop is like keeping your files in a safety
                deposit box — our enterprise-grade security ensures your data
                never leaves your computer.
              </p>
            </div>
            <Security />
          </div>
        </section>

        <section className={cx(css.section, css.grid)}>
          <GridItem size={2}>
            <Mockup type="text" showMenubar />
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
          <GridItem size={1}>
            <Mockup type="image" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>
                Compare photos, images and graphics
              </h2>
              <p className={css.paragraph}>
                Slide to compare images pixel by pixel or seamlessly fade and
                overlay two pictures for a clear result
              </p>
            </div>
          </GridItem>
          <GridItem size={1}>
            <Mockup type="document" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>
                Compare Word and PDF documents
              </h2>
              <p className={css.paragraph}>
                Use our AI software to extract and compare content from two
                PDFs, or merge files to highlight graphic differences
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
          <GridItem size={1}>
            <Mockup type="folder" />
            <div className={css.sectionHeader}>
              <h2 className={css.headingSmall}>Compare folders</h2>
              <p className={css.paragraph}>
                Check folder contents and document details to organize your
                files or see what&apos;s missing
              </p>
            </div>
          </GridItem>
        </section>

        <section className={cx(css.section, css.features)}>
          <div className={css.sectionHeader}>
            <h2 className={css.heading}>Do more with Diffchecker Desktop</h2>
            <p className={css.paragraph}>
              Your all-in-one comparison powerhouse, with over 30+ features for
              a faster, easier workflow.
            </p>
          </div>
          <Features />
        </section>

        <section className={cx(css.sectionDarkWrapper, css.gradientBackground)}>
          <div className={cx(css.section, css.darkMode)}>
            <div className={css.sectionHeader}>
              <h2 className={css.heading}>Welcome to the dark side</h2>
              <p className={cx(css.paragraph, css.securityParagraph)}>
                Forget about dry eyes and screen insomnia. Our dark mode helps
                you stay productive even in low-light environments, all while
                conserving battery power.
              </p>
            </div>
            <Mockup type="darkmode" showMenubar />
          </div>
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
          <Mockup type="merge" showMenubar />
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
            Your browser does not support the videos.
          </video>
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
          <h1 className={css.heading}>Get Diffchecker Desktop</h1>
          <Cta url="/download-trial" position="desktop-footer" />
        </section>
      </main>
    </Page>
  );
};
export default NewDesktop;
