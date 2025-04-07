import Page from 'components/page';
import { text } from 'css/variables';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import Link from 'next/link';

export default function Okta() {
  return (
    <Page name="Okta integration">
      <Head>
        <title>{titleTemplate('Okta integration')}</title>
      </Head>
      <div id="okta">
        <div className="content-title">Integrating Diffchecker with Okta</div>
        <div className="content-sub-title" id="saml">
          SAML Configuration
        </div>
        <b>Prerequisites</b>
        <div className="content-text">
          <ul>
            <li>You should have an Enterprise plan with Diffchecker.</li>
            <li>You should have administrative access to Okta.</li>
          </ul>
        </div>
        <b>Supported features</b>
        <div className="content-text">
          The Okta/Diffchecker SAML integration currently supports the following
          features:
          <ul>
            <li>IdP-initiated SSO</li>
            <li>SP-initiated SSO</li>
          </ul>
          For more information on the listed features, visit the{' '}
          <a
            href="https://help.okta.com/okta_help.htm?type=oie&id=ext_glossary"
            rel="noreferrer"
            target="_blank"
          >
            Okta Glossary
          </a>
          .
        </div>
        <b>Configuration steps</b>
        <div className="content-text">
          <ol>
            <li>
              If you haven&apos;t already, please go to{' '}
              <Link href="/pricing">Diffchecker pricing page</Link> and purchase
              Enterprise plan - only then you&apos;ll be able to use this
              integration.
            </li>
            <li>
              Go to Diffchecker application integration details in your Okta
              Admin Console.
            </li>
            <li>
              Go to &quot;Sign On&quot; tab and click &quot;More details&quot;
              in the &quot;Metadata details&quot; part of &quot;SAML 2.0&quot;
              section. Make sure you can see &quot;Sign on URL&quot;,
              &quot;Issuer&quot; and &quot;Signing Certificate&quot; fields.
            </li>
            <li>
              Keep that browser tab open. In another tab go to your{' '}
              <Link href="/organization">Diffchecker Organization page</Link>.
            </li>
            <li>Click &quot;Set SAML configuration&quot; button.</li>
            <li>
              Input values from Okta Admin Console visible in the other browser
              tab with the following mapping from Okta to Diffchecker panels:
              <ul>
                <li>
                  &quot;Signing Certificate&quot; to &quot;Certificate&quot;
                </li>
                <li>&quot;Issuer&quot; to &quot;Issuer&quot;</li>
                <li>
                  &quot;Sign on URL&quot; to &quot;Entry point URL&quot; and
                  click &quot;Save&quot;
                </li>
              </ul>
            </li>
            <li>You are shown Organization ID - note down that number.</li>
            <li>Go back to Okta Admin Console browser tab.</li>
            <li>
              Click &quot;Edit&quot; on the right to &quot;Settings&quot; title.
            </li>
            <li>
              Scroll down to &quot;Advanced Sign-on Settings&quot; and input
              Organization ID number noted down previously.
            </li>
            <li>
              Below in &quot;Credentials Details&quot; section make sure
              &quot;Application username format&quot; is set to Email.
            </li>
            <li>Click &quot;Save&quot;.</li>
            <li>Your SAML configuration for Diffchecker is complete.</li>
          </ol>
        </div>
        <b>SP-initiated SSO</b>
        <div className="content-text">
          In order to initiate SSO from Diffchecker go to{' '}
          <Link href="/login-saml">SAML login page</Link> and input your email
          address. You will be redirected to Okta login page.
        </div>
        <div className="content-sub-title" id="scim">
          SCIM Configuration
        </div>
        <b>Supported features</b>
        <div className="content-text">
          The Okta/Diffchecker SAML integration currently supports the following
          features:
          <ul>
            <li>Create users</li>
            <li>Update user attributes</li>
            <li>Deactivate users</li>
          </ul>
        </div>
        <b>Configuration steps</b>
        <div className="content-text">
          <ol>
            <li>Please set up SAML for Diffchecker first.</li>
            <li>
              Go to your{' '}
              <Link href="/account/organization">
                Diffchecker Organization page
              </Link>{' '}
              and copy value of &quot;SCIM API Key&quot;.
            </li>
            <li>
              Go to Diffchecker application integration details in your Okta
              Admin Console and click &quot;Provisioning&quot; tab.
            </li>
            <li>
              Click &quot;Configure API Integration&quot; button followed by
              &quot;Enable API integration&quot; checkbox.
            </li>
            <li>Paste value from step 2. and click &quot;Save&quot;.</li>
            <li>
              Inside &quot;Provisioning&quot; tab go to &quot;To App&quot;
              setting. Under &quot;Provisioning to App&quot; click
              &quot;Edit&quot; and make sure that &quot;Create Users&quot;,
              &quot;Update User Attributes&quot; and &quot;Deactivate
              Users&quot; checkboxes are enabled.
            </li>
            <li>Click &quot;Save&quot;.</li>
            <li>Your SCIM configuration for Diffchecker is complete.</li>
          </ol>
        </div>
        <b>Troubleshoot</b>
        <div className="content-text">
          If you have questions or difficulties with your Diffchecker/Okta SCIM
          integration, please contact Diffchecker support{' '}
          <Link href="/contact">here</Link>.
        </div>
      </div>
      <style jsx>{`
        #okta {
          max-width: 840px;
          margin: 0 auto;
        }
        b {
          display: block;
          margin-top: 10px;
          font-weight: bold;
        }
        ul,
        ol {
          margin-left: 20px;
        }
        ul {
          list-style-type: disc;
        }
        ol {
          list-style-type: decimal;
        }
        .content-title {
          font-size: ${text.title.large.size};
          font-weight: ${text.title.weight};
          color: var(--front-strongest);
          text-align: center;
          margin: 20px 0;
        }
        .content-sub-title {
          font-size: ${text.title.medium.size};
          font-weight: ${text.title.weight};
          margin: 25px 0 15px;
        }
        .content-text {
          font-size: ${text.paragraph.default.size};
          line-height: 1.8;
          color: var(--front-strong);
        }
        table {
          text-align: left;
        }
        table th {
          font-weight: bold;
        }
        table th,
        table td {
          padding: 5px 10px;
        }
        table,
        th,
        td {
          border: 1px solid black;
          border-collapse: collapse;
        }
      `}</style>
    </Page>
  );
}
