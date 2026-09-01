import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { MongoClient } from 'mongodb';
import v1Router from './routes/v1';
import { CORS_ORIGINS, ENV } from './config/environment';
import { httpLogger } from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { auth } from './lib/auth';

// Note: Google social provider is configured via `src/config/environment.ts` and
// registered in `src/lib/auth.ts`. We use Better Auth's programmatic API below
// to initiate social sign-in without replacing the existing auth system.

const app = express();
app.set('trust proxy', 1);
const mongoClient = new MongoClient(ENV.MONGODB_URI);

const buildAuthRequest = (req: express.Request, url: string, method: string, body?: unknown) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(key, entry));
      } else {
        headers.set(key, value);
      }
    }
  });

  // Properly extract protocol and host from forwarded headers
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const requestProtocol = req.secure || (protocol ? protocol.startsWith('https') : false) ? 'https' : 'http';
  
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostValue = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  const requestHost = hostValue || req.headers.host;

  const hasBody = method !== 'GET' && method !== 'HEAD' && body !== undefined;
  if (hasBody && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const fullUrl = `${requestProtocol}://${requestHost}${url}`;
  
  // Log OAuth callback requests for debugging
  if (url.includes('/callback/')) {
    console.log('[BUILD AUTH REQUEST] OAuth Callback', {
      path: url,
      protocol: requestProtocol,
      host: requestHost,
      fullUrl,
    });
  }

  return new Request(fullUrl, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
};

const findUserByEmail = async (email: string) => {
  const db = mongoClient.db();
  return db.collection('user').findOne({ email: email.toLowerCase() }, {
    projection: { email: 1, role: 1, emailVerified: 1 },
  });
};

const sendFreshVerificationEmail = async (req: express.Request, email: string) => {
  const verificationReq = buildAuthRequest(req, '/api/auth/send-verification-email', 'POST', { email });
  await auth.handler(verificationReq);
};

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true
  })
);

app.use(httpLogger);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${ENV.UPLOAD_DIR}`, express.static(path.join(process.cwd(), ENV.UPLOAD_DIR)));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

// Explicit route to initiate Google social sign-in using Better Auth programmatic API
app.get('/api/auth/sign-in/google', async (req, res) => {
  try {
    console.log('[GOOGLE SIGN-IN INITIATE]', {
      host: req.headers.host,
      xForwardedProto: req.headers['x-forwarded-proto'],
      xForwardedHost: req.headers['x-forwarded-host'],
      origin: req.headers.origin,
    });

    const extractString = (val: unknown): string | undefined => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val) && val.length && typeof val[0] === 'string') return val[0];
      return undefined;
    };

    const redirectParam = extractString(req.query.redirect);
    const callbackURL = redirectParam
      ? `${ENV.CLIENT_FRONTEND_URL.replace(/\/$/, '')}${redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`}`
      : undefined;
    const socialBody: any = { provider: 'google' };
    if (callbackURL) socialBody.callbackURL = callbackURL;

    const webReq = buildAuthRequest(req, '/api/auth/sign-in/social', 'POST', socialBody);
    console.log('[GOOGLE SOCIAL REQUEST]', {
      url: webReq.url,
      method: webReq.method,
      callbackURL,
    });

    const response = await auth.handler(webReq);
    
    console.log('[GOOGLE SOCIAL RESPONSE]', {
      status: response.status,
      hasLocation: response.headers.has('location'),
      hasSetCookie: response.headers.has('set-cookie'),
      setCookieCount: (response.headers as any).getSetCookie?.()?.length || 0,
    });

    const setCookieValues = typeof (response.headers as any).getSetCookie === 'function'
      ? (response.headers as any).getSetCookie()
      : undefined;

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        if (setCookieValues && setCookieValues.length > 0) {
          res.setHeader('set-cookie', setCookieValues);
        } else {
          res.setHeader('set-cookie', value);
        }
        return;
      }

      res.setHeader(key, value);
    });

    const bodyText = await response.text();
    let bodyJson: any = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    const locationHeader = response.headers.has('location') ? response.headers.get('location') : null;
    const redirectUrl = locationHeader || (bodyJson && bodyJson.redirect && bodyJson.url ? bodyJson.url : null);

    if (redirectUrl) {
      return res.redirect(typeof redirectUrl === 'string' ? redirectUrl : String(redirectUrl));
    }

    res.status(response.status).send(bodyText);
  } catch (err) {
    console.error('[AUTH] sign-in/google error', err);
    res.status(500).send('Error initiating social sign-in');
  }
});

app.all(/\/api\/auth\/.*/, async (req, res) => {
  // Diagnostic logging for auth requests
  const isGoogleCallback = req.path === '/api/auth/callback/google';
  const isGetSession = req.path === '/api/auth/get-session';
  
  if (isGoogleCallback) {
    console.log('[GOOGLE CALLBACK]', {
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      host: req.headers.host,
      xForwardedProto: req.headers['x-forwarded-proto'],
      xForwardedHost: req.headers['x-forwarded-host'],
      userAgent: req.headers['user-agent']?.substring(0, 50),
    });
  }

  if (isGetSession) {
    const cookieHeader = req.headers.cookie;
    console.log('[GET-SESSION REQUEST]', {
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      host: req.headers.host,
      xForwardedProto: req.headers['x-forwarded-proto'],
      xForwardedHost: req.headers['x-forwarded-host'],
      cookiePresent: !!cookieHeader,
      cookieLength: cookieHeader?.length,
    });
  }

  if (req.path === '/api/auth/sign-in/email' && req.method === 'POST') {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const userRecord = email ? await findUserByEmail(email) : null;

    if (userRecord?.role === 'admin') {
      // Admins are intentionally exempt from email verification checks.
    } else if (userRecord && userRecord.emailVerified === false) {
      await sendFreshVerificationEmail(req, email);
      return res.status(403).json({
        message: 'Email not verified. A new verification link has been sent to your email.'
      });
    }
  }

  const webReq = buildAuthRequest(req, req.originalUrl, req.method, req.body);
  const response = await auth.handler(webReq);
  
  if (isGoogleCallback || isGetSession) {
    console.log('[AUTH RESPONSE]', {
      path: req.path,
      status: response.status,
      hasSetCookie: response.headers.has('set-cookie'),
      setCookieCount: (response.headers as any).getSetCookie?.()?.length || 0,
    });
  }

  // Handle Set-Cookie headers properly - must be done before other headers
  // because we need to use getSetCookie() to get all values
  const setCookieValues = typeof (response.headers as any).getSetCookie === 'function'
    ? (response.headers as any).getSetCookie()
    : undefined;

  // Set all cookies first if they exist
  if (setCookieValues && setCookieValues.length > 0) {
    res.setHeader('set-cookie', setCookieValues);
    if (isGoogleCallback) {
      console.log('[SETTING COOKIES]', {
        count: setCookieValues.length,
        first: setCookieValues[0]?.substring(0, 80),
      });
    }
  }

  // Forward other headers (excluding set-cookie which we already handled)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, value);
    }
  });

  const body = await response.text();
  res.status(response.status).send(body);
});

app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);

export default app;

