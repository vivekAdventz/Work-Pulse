import { PublicClientApplication } from '@azure/msal-browser';

// Replace these with your Azure AD app registration values
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

const loginRequest = {
  scopes: ['User.Read'],
};

const msalInstance = new PublicClientApplication(msalConfig);

export { msalInstance, loginRequest };
