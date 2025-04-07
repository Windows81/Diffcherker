import ContentPage from 'components/content-page';
import { DOCS_PAGES } from 'lib/docs-pages';
import Link from 'next/link';

export default function APIDocs() {
  return (
    <ContentPage
      pages={DOCS_PAGES}
      title="Diffchecker API"
      lastRevised="September 18th, 2024"
    >
      <section>
        <p>
          At the moment there exists 3 HTTP endpoints for computing text diffs,
          PDF diffs, and Image diffs, all with varying output types. We plan to
          gradually add more input and output types as we move forward with the
          API (e.g. Excel, etc).
        </p>
        <p>
          You may find the following resources helpful when dealing with PDF and
          image diffs:
        </p>
        <ul>
          <li>
            <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs">
              https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
            </a>
          </li>
          <li>
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/FormData">
              https://developer.mozilla.org/en-US/docs/Web/API/FormData
            </a>
          </li>
        </ul>
        <h2>Authentication</h2>
        <p>There are two ways of interacting with the Diffchecker API:</p>
        <ul>
          <li>
            <strong>Email</strong>: just pass your email as a query string
            parameter. This method does not require you to have a Diffchecker
            account and will allow you to make as many diffs as free tier limits
            allow.
          </li>
          <li>
            <strong>API Key</strong>: every paid subscriber gets their own API
            key, which needs to be passed as the request&apos;s X-Api-Key
            header. This will allow you to make as many diffs as your paid plan
            allows.
          </li>
        </ul>
        <p>
          When both are provided, email gets ignored in favor of the API key.
          The examples in these docs assume you are authenticating via email.
        </p>
      </section>
      <section>
        <h2>Next Steps</h2>
        <ul>
          <li>
            <Link href="/docs/text">Text Diff API</Link>
          </li>
          <li>
            <Link href="/docs/image">Image Diff API</Link>
          </li>
          <li>
            <Link href="/docs/document">Document Diff API</Link>
          </li>
        </ul>
      </section>
    </ContentPage>
  );
}
