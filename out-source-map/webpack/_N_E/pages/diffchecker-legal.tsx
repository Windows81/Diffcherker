import * as React from 'react';
import Page from 'components/new/page';
import desktopCss from './desktop.module.css';
import css from './diffchecker-legal.module.css';
import cx from 'classnames';
import Marquee from 'components/brands-marquee';
import ImageRetina from 'components/imageRetina';
import Icon from 'components/shared/icon';
import SecurityOfflineIcon from 'static/images/new/security-offline.svg';
import SecurityPrivateIcon from 'static/images/new/security-private.svg';
import SecuritySecureIcon from 'static/images/new/security-secure.svg';
import WordLogo from 'static/images/new/word-logo.svg';
import PdfLogo from 'static/images/new/pdf-logo.svg';
import ExcelLogo from 'static/images/new/excel-logo.svg';
import PptLogo from 'static/images/new/powerpoint-logo.svg';
import ImageLogo from 'static/images/new/image-logo.svg';
import FolderIcon from 'static/images/new/folder-icon.svg';
import PreferencesIcon from 'components/shared/icons/preferences-green.svg';
import ArrowUpRightCircleIcon from 'components/shared/icons/arrow-up-right-circle.svg';
import VerifiedIcon from 'components/shared/icons/verified.svg';
import APIIcon from 'components/shared/icons/api.svg';
import PdfSvg from 'components/shared/icons/pdf-green.svg';
import Cta from 'components/content-pages/cta';

const FeatureItem: React.FC<{
  title: string;
  description: React.ReactNode;
  image: string;
  icon: React.ReactNode;
}> = ({ title, description, image, icon }) => {
  return (
    <div className={cx(css.featureItem, css.border)}>
      <div className={css.title}>
        <div>{icon}</div>
        <span>{title}</span>
      </div>
      <h2 className={cx(desktopCss.headingXs, css.description)}>
        {description}
      </h2>
      <ImageRetina format="png" src={image} alt={title} display="" />
    </div>
  );
};

const DiffcheckerLegal: React.FC = () => {
  const title = `Document Comparison Software for Legal Professionals - Diffchecker Legal`;
  return (
    <Page
      name="Diffchecker Legal"
      title={title}
      metaDescription="Document comparison software trusted by legal professionals. Redline contracts, agreements, and legal documents with unmatched accuracy and security."
      metaKeywords="legal document comparison, contract comparison software, redline legal documents, legal document review, legal text diff, document version control for lawyers, legal document management, contract redlining tool, secure legal document comparison, legal tech software"
      fullWidth
    >
      <main className={cx(css.main, css.dottedGridBackground)}>
        <section className={css.paddingTop}>
          <h1 className={css.heading}>
            Document comparison software <br /> designed for{' '}
            <span className={css.fancyText}>legal professionals</span>
          </h1>
          <p
            className={cx(
              css.paragraph,
              css.paddingSide,
              desktopCss.heroParagraph,
            )}
          >
            Track your document changes with the most used document comparison
            software on the web
          </p>
          <div className={css.ctaContainer}>
            <Cta url="/download-trial" showPricing position="desktop-hero" />
          </div>
          <div
            className={cx(desktopCss.logos, css.paddingTop)}
            style={{ scale: '0.7' }}
          >
            <Marquee />
          </div>
        </section>

        <section className={css.contractImage}>
          <ImageRetina
            format="png"
            src="mockups/legal/contract"
            alt="contract comparison"
          />
        </section>

        <section>
          <div className={css.quoteContainer}>
            <p>
              &ldquo;<span>Diffchecker</span> has been great for my company to
              compare code and PDF documents quickly and accurately. I
              appreciate having one tool to compare multiple types of files.
              Diffchecker is a step above Adobe in terms of file
              comparison.&ldquo;
            </p>
            <span className={css.name}>Nicholas English, JD.</span>{' '}
            <span className={css.jobRole}>Vice President & Co-Founder</span>
            <br />
            <div className={css.sourceContainer}>
              <Icon svg={VerifiedIcon} size="small" />
              <span>Terabitten Technologies Inc.</span>
            </div>
          </div>
        </section>

        <section>
          <div className={css.securityBannerContainer}>
            <div className={css.container}>
              <div className={css.flex40}>
                <div className={cx(css.sectionHeader, css.title)}>
                  <h2 className={css.headingSmall}>
                    Enterprise-grade security
                  </h2>
                  <p className={css.paragraph}>
                    Diffchecker Legal delivers the security and confidentiality
                    required for sensitive legal documents and client contracts
                  </p>
                </div>
              </div>
              <div className={cx(css.securityImage, css.flex60)}>
                <ImageRetina
                  format="png"
                  src="mockups/legal/security"
                  alt="Security"
                />
              </div>
            </div>
            <div className={css.securityBannerItemsContainer}>
              <div className={css.boxContainer}>
                <div className={css.item}>
                  <div className={css.icon}>
                    <SecurityOfflineIcon />
                  </div>
                  <span>OFFLINE</span>
                </div>
                <p>
                  Our desktop application always works offline so your sensitive
                  files never leave your computer.
                </p>
              </div>
              <div className={css.boxContainer}>
                <div className={css.item}>
                  <div className={css.icon}>
                    <SecurityPrivateIcon />
                  </div>
                  <span>PRIVATE</span>
                </div>
                <p>
                  Your data is always yours. We do not collect any information
                  about how you use our desktop app.
                </p>
              </div>
              <div className={css.boxContainer}>
                <div className={css.item}>
                  <div className={css.icon}>
                    <SecuritySecureIcon />
                  </div>
                  <span>SECURE</span>
                </div>
                <p>
                  No client data is stored on our servers, so nothing can be
                  breached.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={css.paddingTop}>
          <div className={css.container}>
            <div className={cx(css.largeSpacingSideBySide, css.flex40)}>
              <div className={css.descriptionContainer}>
                <div className={css.pillContainer}>
                  <div className={css.pillLogo}>
                    <WordLogo />
                  </div>
                  <div className={css.pillLogo}>
                    <PdfLogo />
                  </div>
                  <span className={css.pill}>.PDF</span>
                  <span className={css.pill}>.DOC</span>
                  <span className={css.pill}>.DOCX</span>
                  <span className={css.pill}>.RTF</span>
                </div>
                <h2 className={css.headingSmall}>
                  Effortlessly compare PDF and Word documents
                </h2>
                <p className={css.paragraph}>
                  We compare documents across multiple formats—whether comparing
                  PDF to Word, PDF to PDF, or Word to Word—to help you identify
                  all changes between different versions.
                </p>
              </div>
            </div>
            <div className={cx(css.imageContainer, css.flex60)}>
              <ImageRetina
                format="png"
                src="mockups/legal/rich-text"
                alt="Rich text comparison"
              />
            </div>
          </div>
        </section>

        <section className={css.paddingTop}>
          <div className={css.section}>
            <div className={css.sectionHeader}>
              <div className={css.pillContainer}>
                <div className={css.pillLogo}>
                  <WordLogo />
                </div>
                <span className={css.pill}>.DOC</span>
                <span className={css.pill}>.DOCX</span>
              </div>
              <h2 className={css.headingSmall}>
                Create redlines at lightning speed
              </h2>
              <p className={css.paragraph}>
                Generate professional redlines with customization options to
                match your specific needs.
              </p>
            </div>
            <div className={css.redlineImage}>
              <ImageRetina
                format="png"
                src="mockups/legal/redline"
                alt="Redline comparison"
              />
            </div>
          </div>
        </section>

        <section>
          <div className={css.container}>
            <div className={cx(css.largeSpacing, css.flex50, css.borderRight)}>
              <div className={css.descriptionContainer}>
                <div className={css.pillContainer}>
                  <div className={css.pillLogo}>
                    <ExcelLogo />
                  </div>
                  <span className={css.pill}>.XLSX</span>
                  <span className={css.pill}>.XLS</span>
                  <span className={css.pill}>.CSV</span>
                </div>
                <h2 className={cx(css.headingSmall)}>
                  Track changes in <br /> spreadsheets
                </h2>
                <p className={cx(css.paragraph, css.fixedWidth)}>
                  Compare Excel files and other data formats to find any changes
                  in spreadsheets and tables.
                </p>
              </div>
              <div className={css.imageContainer}>
                <ImageRetina
                  format="png"
                  src="mockups/legal/spreadsheet"
                  alt="Spreadsheet comparison"
                />
              </div>
            </div>
            <div className={cx(css.largeSpacing, css.flex50)}>
              <div className={css.descriptionContainer}>
                <div className={css.pillContainer}>
                  <div className={css.pillLogo}>
                    <PptLogo />
                  </div>
                  <div className={css.pillLogo}>
                    <ImageLogo />
                  </div>
                  <span className={css.pill}>.PNG</span>
                  <span className={css.pill}>.JPG</span>
                  <span className={css.pill}>.PDF</span>
                </div>
                <h2 className={css.headingSmall}>
                  Compare presentations, <br />
                  scans, images and more
                </h2>
                <p className={cx(css.paragraph, css.fixedWidth)}>
                  Our advanced OCR technology enables you to compare scanned
                  documents, presentations, and images.
                </p>
              </div>
              <div className={css.imageContainer}>
                <ImageRetina
                  format="png"
                  src="mockups/legal/image"
                  alt="Image comparison"
                />
              </div>
            </div>
          </div>
        </section>

        <section className={css.paddingTop}>
          <div className={css.container}>
            <div className={cx(css.largeSpacingSideBySide, css.flex40)}>
              <div className={css.descriptionContainer}>
                <div className={css.pillContainer}>
                  <div className={css.pillLogo}>
                    <FolderIcon />
                  </div>
                  <span className={css.pill}>FOLDERS</span>
                </div>
                <h2 className={css.headingSmall}>Compare entire directories</h2>
                <p className={css.paragraph}>
                  Quickly identify modified documents across hundreds of files,
                  enabling your team to efficiently track changes and streamline
                  document review.
                </p>
              </div>
            </div>
            <div className={cx(css.imageContainer, css.flex60)}>
              <ImageRetina
                format="png"
                src="mockups/legal/folders"
                alt="Folder comparison"
              />
            </div>
          </div>
        </section>

        <section>
          <div className={css.quoteContainer}>
            <p>
              &ldquo;One of the best aspects of <span>Diffchecker</span> is its
              intuitive and user-friendly interface, which makes comparing
              files, text, and code effortless, even for those new to such
              tools.&ldquo;
            </p>
            <span className={css.name}>Nikisha P.,</span>{' '}
            <span className={css.jobRole}>Industry Professional</span>
            <br />
            <div className={css.sourceContainer}>
              <Icon svg={VerifiedIcon} size="small" />
              <span>Verified by G2.com</span>
            </div>
          </div>
        </section>

        <section>
          <div className={css.container}>
            <div className={cx(css.flex35)}>
              <div className={css.featureTitle}>
                <div className={css.featureTitleLogo}>
                  <img src="/static/electron/icon.svg" alt="Diffchecker logo" />
                </div>
                <h2 className={css.headingSmall}>
                  Powerful features at your fingertips
                </h2>
                <p className={css.paragraph}>
                  Diffchecker Legal offers the most powerful and seamless
                  experience for legal teams of all sizes.
                </p>
              </div>
            </div>

            <div className={cx(css.flex65)}>
              <div className={css.featureGrid}>
                <FeatureItem
                  title="Export and send"
                  description={
                    <div>
                      Easily <span>export</span> PDFs and Word documents, send{' '}
                      <span>emails</span>, and print your comparisons.
                    </div>
                  }
                  image="mockups/legal/export"
                  icon={<PdfSvg width="24px" height="24px" />}
                />
                <FeatureItem
                  title="Styles"
                  description={
                    <div>
                      Customize <span>text styles</span>, and create new ones
                      for you and your team.
                    </div>
                  }
                  image="mockups/legal/styles"
                  icon={<PreferencesIcon />}
                />
                <FeatureItem
                  title="Integrations"
                  description={
                    <div>
                      Coming soon: Integration with <span>iManage</span> and
                      other document management systems. <br />
                    </div>
                  }
                  image="mockups/legal/imanage"
                  icon={<APIIcon />}
                />
                <FeatureItem
                  title="Performance"
                  description={
                    <div>
                      <span>Performance</span> you can trust. Half a million
                      people use Diffchecker every month.
                    </div>
                  }
                  image="mockups/legal/performance"
                  icon={<ArrowUpRightCircleIcon />}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={cx(desktopCss.bottom, css.dottedGridBackground)}>
          <h1 className={css.headingSmall}>Get Diffchecker Legal</h1>
          <Cta url="/download-trial" position="desktop-footer" />
        </section>
      </main>
    </Page>
  );
};

export default DiffcheckerLegal;
