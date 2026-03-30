import { PublicClientApplication } from '@azure/msal-browser';

// Detect if we are running inside the Capacitor native shell (Android/iOS)
// window.Capacitor is injected by the native bridge at runtime
export const isCapacitorApp = !!(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.platform);

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID || 'common'}`,
    // On mobile (Capacitor) we use popup so the auth flow stays inside the WebView.
    // On web we use the page origin for the standard redirect flow.
    redirectUri: window.location.origin,
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

export { msalInstance, loginRequest };
