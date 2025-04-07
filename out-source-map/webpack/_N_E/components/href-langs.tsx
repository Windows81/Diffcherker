import Head from 'next/head';

interface HrefLangsProps {
  path: string;
  locales?: string[];
}

const HrefLangs: React.FC<HrefLangsProps> = ({ path, locales }) => {
  const defaultHref = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
  return (
    <Head>
      {locales &&
        locales?.map((locale) => {
          if (locale === 'en') {
            return (
              <link
                key={locale}
                rel="alternate"
                hrefLang={locale}
                href={defaultHref}
              />
            );
          }
          const href = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}${path}`;
          return (
            <link key={locale} rel="alternate" hrefLang={locale} href={href} />
          );
        })}
      <link rel="alternate" hrefLang="x-default" href={defaultHref} />
    </Head>
  );
};

export default HrefLangs;
