import { PublicClientApplication, NavigationClient } from '@azure/msal-browser';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Detect if we are running inside the Capacitor native shell (Android/iOS)
export const isCapacitorApp = !!(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.platform);

class CapacitorNavigationClient extends NavigationClient {
  async navigateExternal(url, options) {
    if (isCapacitorApp) {
      await Browser.open({ url });
      return false; // Tells MSAL we handled the navigation
    }
    if (options.noHistory) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
    return true;
  }
}

const nativeRedirectUri = 'msauth://com.workpulse.app/rqLyNUP27fT6WvIh6xoN53FBJlQ%3D';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID || 'common'}`,
    redirectUri: isCapacitorApp ? nativeRedirectUri : window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    allowRedirectInIframe: true,
    navigateToLoginRequestUrl: false,
  },
};

const loginRequest = {
  scopes: ['User.Read'],
};

const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.setNavigationClient(new CapacitorNavigationClient());

export { msalInstance, loginRequest };
