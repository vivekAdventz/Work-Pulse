import 'dotenv/config';

// Central env config — import this instead of dotenv/config or process.env directly.
// Guarantees dotenv is loaded before any value is read.

export const MONGODB_URI = process.env.MONGODB_URI || (() => { throw new Error('MONGODB_URI is not set'); })();
export const JWT_SECRET   = process.env.JWT_SECRET   || (() => { throw new Error('JWT_SECRET is not set'); })();
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const PORT         = process.env.PORT || '5000';

// MS Auth (optional — only used for SSO validation on backend)
export const MS_CLIENT_ID = process.env.MS_CLIENT_ID || '';
export const MS_TENANT_ID = process.env.MS_TENANT_ID || '';
