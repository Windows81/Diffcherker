import ContentPage from 'components/content-page';
import { DOCS_PAGES } from 'lib/docs-pages';
import css from '../components/content-page.module.css';

export default function CLI() {
  return (
    <ContentPage
      pages={DOCS_PAGES}
      title="Diffchecker CLI"
      lastRevised="September 18th, 2024"
    >
      <section>
        <h2>Overview</h2>
        <p>
          Now you can create cloud-hosted diffs right from the command line.
          Easily compare 2 files, or compare a current file with the version of
          itself from the most recent commit.
        </p>
        <p>
          Why use this instead of a native app? Because your diffs are instantly
          uploaded so you can share them with others.
        </p>
        <video className={css.cliVideo} controls>
          <source src="/static/videos/diffchecker-cli.mp4" />
        </video>
      </section>

      <section>
        <h2>Installation</h2>
        <p>
          First, make sure you have Node with npm installed from{' '}
          <a href="https://nodejs.org">nodejs.org</a>
        </p>
        <p>Then:</p>
        <pre className={css.codeBlock}>
          <code>npm install -g diffchecker</code>
        </pre>
      </section>

      <section>
        <h2 id="usage">Usage</h2>
        <h3>Compare two files</h3>
        <pre className={css.codeBlock}>
          <code>diffchecker file1.js file2.js</code>
        </pre>

        <h3>Compare with most recent git commit</h3>
        <p>
          To compare a file with its version from the most recent git commit:
        </p>
        <pre className={css.codeBlock}>
          <code>diffchecker file1.js</code>
        </pre>
        <p>Both methods will open the diff in your default browser.</p>

        <h3>Set expiration</h3>
        <p>
          By default, the diffs don&apos;t expire. You can change it to 1 day, 1
          month or forever like this:
        </p>
        <pre className={css.codeBlock}>
          <code>diffchecker --expires day file1.js file2.js</code>
        </pre>

        <h3>Sign out</h3>
        <p>Should you want to sign out:</p>
        <pre className={css.codeBlock}>
          <code>diffchecker --signout</code>
        </pre>
      </section>
    </ContentPage>
  );
}
