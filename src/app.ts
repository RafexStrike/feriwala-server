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

  const hasBody = method !== 'GET' && method !== 'HEAD' && body !== undefined;
  if (hasBody && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return new Request(`http://${req.headers.host}${url}`, {
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

// Temporary debug endpoint to inspect auth object keys (no secrets)
// (no debug endpoints in production-ready code)

app.get('/api/auth/debug', (_req, res) => {
  // Expose minimal information useful for debugging auth setup (no secrets)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const api = (auth as any).api;
  res.json({
    hasApi: !!api,
    hasSignInSocial: api && typeof api.signInSocial === 'function',
    googleConfigured: !!ENV.GOOGLE_CLIENT_ID && !!ENV.GOOGLE_CLIENT_SECRET,
    betterAuthUrl: ENV.BETTER_AUTH_URL,
  });
});

// Explicit route to initiate Google social sign-in using Better Auth programmatic API
app.get('/api/auth/sign-in/google', async (req, res) => {
  try {
    console.info(`[AUTH SIGNIN] ${req.method} ${req.originalUrl}`);
    // Build a POST to the Better Auth `sign-in/social` endpoint so it can set
    // the OAuth state cookie and return the provider redirect URL.
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
    const response = await auth.handler(webReq);
    console.info(`[AUTH SIGNIN] handler responded ${response.status}`);

    // Forward headers (including Set-Cookie) from the auth handler
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // If the auth handler provided a Location header, forward it. Some
    // Better Auth endpoints return 200 with a Location header and JSON
    // indicating `redirect: true`.
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

  console.info(`[AUTH PROXY] ${req.method} ${req.originalUrl} -> ${response.status}`);

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.text();
  res.status(response.status).send(body);
});

app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);

export default app;

