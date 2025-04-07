// pages/_app.js
import * as React from 'react';
import 'css/dropzone-overrides.css';
import 'css/hljs-theme-vs.css';
import 'css/new.css';
import 'css/old.css';
import 'css/print.css';
import 'css/tooltip.css';
import 'css/variables.css';
import 'css/global.css';
import 'css/theme.css';
import 'react-responsive-modal/styles.css';

// Polyfills
import 'web/lib/find-last-polyfill';

// Functions, Classes, Etc...
import createWebUrl from 'lib/create-web-url';
import { Languages } from 'lib/react-tiny-i18n';
import { captureException, init } from 'lib/sentry';
import App, { type AppInitialProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { getCurrentUser } from 'redux/modules/user-module';
import { type AppDispatch, wrapper } from 'redux/store';
import { fetchFeatures } from 'redux/modules/app-module';
import { TrackingInjector } from '../context/tracking';
import { isNetworkError } from 'lib/get-network-error-code';
import { DesktopModalInjector } from 'components/new/desktop-modal/context';

init();

class WrappedApp extends App<AppInitialProps> {
  public static getInitialProps = wrapper.getInitialAppProps(
    (store) =>
      async ({ Component, ctx }) => {
        if (
          ctx.locale === 'undefined' &&
          !process.env.NEXT_PUBLIC_IS_ELECTRON
        ) {
          captureException('String undefined locale');
        }
        if (!ctx.locale && !process.env.NEXT_PUBLIC_IS_ELECTRON) {
          captureException(
            `Have undefined locale with asPath: ${ctx.asPath}, pathname: ${ctx.pathname}, defaultLocale: ${ctx.defaultLocale}`,
          );
        }
        let messages = {};
        try {
          messages = (await import(`../messages/${ctx.locale || 'en'}.json`))
            .default;
        } catch (e) {
          if (e) {
            captureException(e);
          }
          captureException('Could not get messages for locale: ' + ctx.locale);
        }

        const isServer = !!ctx.req;
        if (isServer && !process.env.NEXT_PUBLIC_IS_ELECTRON) {
          const dispatch = store.dispatch as AppDispatch; // https://github.com/kirill-konshin/next-redux-wrapper/issues/207#issuecomment-710063652
          try {
            if (ctx.req?.headers.cookie) {
              await dispatch(getCurrentUser(ctx.req?.headers.cookie)).unwrap();
            }
            await dispatch(fetchFeatures());
          } catch (e) {
            const isInvalidCookieError = isNetworkError(e) && e.status === 401;

            if (!isInvalidCookieError) {
              captureException(e);
            }
          }
        }
        return {
          pageProps: {
            // Call page-level getInitialProps
            ...(Component.getInitialProps
              ? await Component.getInitialProps(ctx)
              : {}),
            messages,
          },
        };
      },
  );

  public render() {
    const { Component, pageProps, err } = this.props as typeof this.props & {
      err: unknown;
    };
    return (
      <>
        <Head>
          <meta
            key="viewport"
            id="viewport"
            name="viewport"
            content="width=device-width"
          />
          <meta key="xuaCompat" httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            key="keywords"
            name="keywords"
            content={pageProps.messages.Meta.keywords}
          />
          <meta
            key="description"
            name="description"
            content={pageProps.messages.Meta.content}
          />
          <meta
            key="ogDescription"
            property="og:description"
            content={pageProps.messages.Meta.content}
          />
          <meta key="fbAdmins" property="fb:admins" content="506766675" />
          <meta key="ogType" property="og:type" content="website" />
          <meta key="ogImageWidth" property="og:image:width" content="1200" />
          <meta key="ogImageHeight" property="og:image:height" content="600" />
          <meta
            key="ogImage"
            property="og:image"
            content={createWebUrl('/static/images/fb-image.png')}
          />
        </Head>
        {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <>
            <Script
              id="gsi-client"
              strategy="lazyOnload"
              type="text/javascript"
              dangerouslySetInnerHTML={{
                __html: `
                if (typeof window !== 'undefined' && !isMobile()) {
                  var s = document.createElement('script');
                  s.type = 'text/javascript';
                  s.src = 'https://accounts.google.com/gsi/client';
                  s.async = true;
                  s.defer = true;
                  var x = document.getElementsByTagName('script')[0];
                  x.parentNode.insertBefore(s, x);
                }
            `,
              }}
            />
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{
                __html: `
                if (typeof window !== 'undefined' && typeof window.mixpanel === 'undefined') {
                  var MIXPANEL_CUSTOM_LIB_URL = 'https://t.diffchecker.com/__mix/lib.min.js';
                  (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
                  for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
                  mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_API_KEY}', {
                    api_host: 'https://t.diffchecker.com',
                    persistence: 'localStorage',
                    loaded: (mixpanel) => {
                      if (window.anonymousProperties) {
                        window.setAnonymousProperties(mixpanel.get_distinct_id(), window.anonymousProperties);
                      }
                    }
                  });
                }
                `,
              }}
            />
          </>
        )}
        <TrackingInjector>
          <Languages
            languages={{ default: pageProps.messages }}
            defaultLanguage="default"
          >
            <DesktopModalInjector>
              <Component {...pageProps} err={err} />
            </DesktopModalInjector>
          </Languages>
        </TrackingInjector>
        {!process.env.NEXT_PUBLIC_IS_ELECTRON &&
          process.env.NEXT_PUBLIC_GA_TRACKING_CODE_2 && (
            <>
              <Script
                id="_next-ga-init"
                dangerouslySetInnerHTML={{
                  __html: `
                  if (typeof window !== 'undefined') {
                    window['dataLayer'] = window['dataLayer'] || [];
                    function gtag(){window['dataLayer'].push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_CODE_2}', { send_page_view: false });
                   }`,
                }}
              />
              <Script
                id="_next-ga"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_CODE_2}`}
              />
            </>
          )}
      </>
    );
  }
}

export default wrapper.withRedux(WrappedApp);
