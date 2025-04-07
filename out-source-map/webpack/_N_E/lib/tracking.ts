import axios from 'axios';
import type { Mixpanel, Dict as MixpanelDict } from 'mixpanel-browser';
import yn from 'yn';

import createApiUrl from './create-api-url';
import { State } from 'redux/store';

declare global {
  interface Window {
    mixpanel: Mixpanel;
    initialized?: boolean;
    anonymousProperties?: UserProperties;
    setAnonymousProperties: (
      distinctId: string,
      properties: UserProperties,
    ) => void;
  }
}

export type EventProperties = MixpanelDict;
export type UserProperties = Record<string, string | number | boolean>;

export class TrackingClass {
  private _reduxStore: State | undefined = undefined;

  set reduxStore(store: State) {
    this._reduxStore = store;
  }

  get state(): State | undefined {
    return this._reduxStore;
  }

  get storedDesktopPreference(): boolean {
    const settingExists =
      this.isClientSide &&
      typeof window?.store?.get('app.allowUsageDataCollection') === 'undefined';
    if (settingExists) {
      return window.store.get('app.allowUsageDataCollection');
    } else {
      return true;
    }
  }

  get isServerSide(): boolean {
    return typeof window === 'undefined';
  }

  get isClientSide(): boolean {
    return !this.isServerSide;
  }

  get isWebApp(): boolean {
    return !this.isDesktopApp;
  }

  get isDesktopApp(): boolean {
    return !!yn(process.env.NEXT_PUBLIC_IS_ELECTRON);
  }

  get allowedToTrack(): boolean {
    if (yn(process.env.OFFLINE_BUILD)) {
      return false;
    }

    if (this.state) {
      if (this.state.license.planTier === 'enterprise') {
        return false;
      } else {
        return this.state?.app.allowUsageDataCollection;
      }
    } else {
      if (this.isDesktopApp) {
        return this.storedDesktopPreference;
      } else {
        return true;
      }
    }
  }

  init(): void {
    if (this.isServerSide) {
      console.warn(`Mixpanel initialization can't happen server side`);
      return;
    }

    if (!this.allowedToTrack) {
      return;
    }

    if (!process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) {
      console.error('Failed initializing Mixpanel: API KEY MISSING');
      return;
    }

    if (window.initialized) {
      return;
    }

    if (this.isDesktopApp) {
      window.mixpanel = require('mixpanel-browser').default;
      // @ts-expect-error: config and name are optional but the types package doesn't say so
      window.mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_API_KEY, {
        persistence: 'localStorage',
      });
    }

    if (window.mixpanel) {
      // somewhat hacky - there's no proper way to check for an anonymous user, but they are given the distinct id `$device:[UUID]`
      window.setAnonymousProperties = (
        distinctId: string,
        properties: UserProperties,
      ): void => {
        if (distinctId.startsWith('$')) {
          axios.post(createApiUrl('/external/mixpanel/user-properties'), [
            {
              $token: process.env.NEXT_PUBLIC_MIXPANEL_API_KEY,
              $distinct_id: distinctId,
              $set: properties,
            },
          ]);
        }
      };

      this.setInitProperties();
      window.initialized = true;
      return;
    }

    console.error(
      'Mixpanel was never initialized. Mixpanel script tag is likely missing or not initializng mixpanel!',
    );
  }

  setInitProperties(): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.setUserProperties({
      client: this.isDesktopApp ? 'desktop' : 'web',
    });
    if (this.isDesktopApp) {
      this.setSuperProperties({ appVersion: window.appVersion });
    }
  }

  trackPage(page: string): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.trackMixpanelPage(page);
  }

  trackMixpanelPage(page: string): void {
    if (!this.allowedToTrack) {
      return;
    }
    if (!window.initialized) {
      this.init();
    }
    if (window.mixpanel) {
      window.mixpanel.track_pageview({ page });
    }
  }

  trackEvent(event: string, properties: EventProperties = {}): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.trackMixpanelEvent(event, properties);
  }

  trackMixpanelEvent(event: string, properties: EventProperties = {}): void {
    if (!this.allowedToTrack) {
      return;
    }
    if (!window.initialized) {
      this.init();
    }

    if (window.mixpanel) {
      window.mixpanel.track(event, this.serializeErrors(properties));
    }
  }

  setSuperProperties(properties: EventProperties): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.setMixpanelSuperProperties(properties);
  }

  setMixpanelSuperProperties(properties: EventProperties): void {
    if (!this.allowedToTrack) {
      return;
    }
    if (window.mixpanel) {
      window.mixpanel.register(properties);
    }
  }

  setUserProperties(properties: UserProperties): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.setMixpanelUserProperties(properties);
  }

  setMixpanelUserProperties(properties: UserProperties): void {
    if (!this.allowedToTrack) {
      return;
    }
    if (window.mixpanel) {
      window.mixpanel.people.set(properties);

      // if the user isn't logged in, the properties are only queued up to be sent upon login so we need to set them separately for anonymous users
      const distinctId: string | undefined =
        window.mixpanel.get_distinct_id?.(); // unlike other functions, get_distinct_id does not exist if mixpanel has not fully loaded
      if (distinctId !== undefined) {
        window.setAnonymousProperties(distinctId, properties);
      } else {
        window.anonymousProperties = {
          ...(window.anonymousProperties || {}),
          ...properties,
        };
      }
    }
  }

  setAbTestGroups(abTestGroups: UserProperties): void {
    if (!this.allowedToTrack) {
      return;
    }
    this.setUserProperties(abTestGroups);
  }

  setUserId(userId: number): void {
    if (!this.allowedToTrack) {
      return;
    }
    const userIdString = userId.toString();
    if (window.mixpanel) {
      window.mixpanel.identify(userIdString);
    }
  }

  /**
   * Allows Error objects to be passed to to MixPanel as plain old javascript objects with properties
   * stringified.
   * @todo Could support doing this on any object with a prototype maybe?
   */
  serializeErrors(properties: EventProperties): EventProperties {
    return Object.getOwnPropertyNames(properties).reduce(
      (acc: EventProperties, name) => {
        acc[name] =
          properties[name] instanceof Error
            ? JSON.parse(
                JSON.stringify(
                  properties[name],
                  Object.getOwnPropertyNames(properties[name]),
                ),
              )
            : properties[name];
        return acc;
      },
      {},
    );
  }

  handleLogout(): void {
    if (!this.allowedToTrack) {
      return;
    }
    if (window.mixpanel) {
      window.mixpanel.reset();
    }
    this.setInitProperties();
  }
}

const Tracking = new TrackingClass();
export default Tracking;
