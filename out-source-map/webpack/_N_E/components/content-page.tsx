import { useState } from 'react';
import Page from './new/page';
import css from './content-page.module.css';
import Button from './shared/button';
import { useRouter } from 'next/router';
import cx from 'classnames';
import Breadcrumbs from './shared/navigation/breadcrumbs';
import Breadcrumb from './shared/navigation/breadcrumb';
import titleTemplate from 'lib/title-template';
import ChevronDownSVG from 'components/shared/icons/chevron-down.svg';
import ChevronRightSVG from 'components/shared/icons/chevron-right.svg';

type ContentPage = {
  title: string;
  href: string;
};

interface ContentPageProps {
  pages: {
    category: string;
    pages: ContentPage[];
  }[];
  title: string;
  children: React.ReactNode;
  lastRevised?: string;
}

export default function ContentPage({
  title,
  children,
  lastRevised,
  pages,
}: ContentPageProps) {
  const path = useRouter().pathname;
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const toggleNav = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  return (
    <Page name={title} title={titleTemplate(title)} fullWidth>
      <main className={css.main}>
        <aside className={css.aside}>
          <div className={css.stickyContainer}>
            <Button
              style="secondary"
              tone="base"
              size="large"
              className={css.navToggle}
              onClick={toggleNav}
              iconStartSvg={isNavExpanded ? ChevronDownSVG : ChevronRightSVG}
              fullWidth
            >
              Menu
            </Button>
            <div
              className={cx(css.navContent, { [css.expanded]: isNavExpanded })}
            >
              {pages.map(({ category, pages }) => (
                <section key={category} className={css.appTypeSection}>
                  <h3 className={css.appTypeHeader}>{category}</h3>
                  <div className={css.appTypeSectionContent}>
                    {pages.map(({ title, href }) => (
                      <SideTab key={href} path={path} href={href}>
                        {title}
                      </SideTab>
                    ))}
                  </div>
                </section>
              ))}
              <div className={css.helpBox}>
                <div className={css.helpTitle}>Do you need help?</div>
                <div className={css.helpDesc}>
                  Get the answers you need from our experts
                </div>
                <Button nextLink href="/contact" style="secondary" tone="base">
                  Contact us
                </Button>
              </div>
            </div>
          </div>
        </aside>
        <article className={css.article}>
          <header>
            <Breadcrumbs>
              <Breadcrumb href="/">Home</Breadcrumb>
              <Breadcrumb href="#">{title}</Breadcrumb>
            </Breadcrumbs>
            <h1 className={css.title}>{title}</h1>
          </header>
          {lastRevised && (
            <div className={css.lastRevised}>Last Revised: {lastRevised}</div>
          )}

          <div className={css.content}>{children}</div>
        </article>
      </main>
    </Page>
  );
}

function SideTab({
  children,
  href,
  path,
}: {
  children: React.ReactNode;
  href: string;
  path: string;
}) {
  return (
    <Button
      className={cx(css.legalLink, {
        [css.active]: path === href,
      })}
      nextLink
      href={href}
      style={path === href ? 'secondary' : 'text'}
      tone="base"
      fullWidth
    >
      {children}
    </Button>
  );
}
