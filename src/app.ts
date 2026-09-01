import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { MongoClient } from 'mongodb';
import { toNodeHandler } from 'better-auth/node';
import v1Router from './routes/v1';
import { CORS_ORIGINS, ENV } from './config/environment';
import { httpLogger } from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { auth } from './lib/auth';

const app = express();
app.set('trust proxy', 1);
const mongoClient = new MongoClient(ENV.MONGODB_URI);
const authHandler = toNodeHandler(auth);

const findUserByEmail = async (email: string) => {
  const db = mongoClient.db();
  return db.collection('user').findOne({ email: email.toLowerCase() }, {
    projection: { email: 1, role: 1, emailVerified: 1 },
  });
};

const buildAuthRequest = (req: express.Request, url: string, method: string, body?: unknown) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(key, entry));
      } else {
        headers.set(key, value as string);
      }
    }
  });

  // Honor forwarded proto/host when behind proxies
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto as string | undefined;
  const requestProtocol = req.secure || (protocol ? protocol.startsWith('https') : false) ? 'https' : 'http';

  const forwardedHost = req.headers['x-forwarded-host'];
  const hostValue = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost as string | undefined;
  const requestHost = hostValue || (req.headers.host as string | undefined) || '';

  const hasBody = method !== 'GET' && method !== 'HEAD' && body !== undefined;
  if (hasBody && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const fullUrl = `${requestProtocol}://${requestHost}${url}`;
  return new Request(fullUrl, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
};

const sendFreshVerificationEmail = async (email: string) => {
  const response = await fetch(new URL('/api/auth/send-verification-email', ENV.BETTER_AUTH_URL).toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    console.error('[AUTH] Failed to send fresh verification email', response.status, response.statusText);
  }
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

app.use('/api/auth', async (req, res, next) => {
  if (req.originalUrl === '/api/auth/sign-in/email' && req.method === 'POST') {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const userRecord = email ? await findUserByEmail(email) : null;

    if (userRecord?.role === 'admin') {
      // Admins are intentionally exempt from email verification checks.
    } else if (userRecord && userRecord.emailVerified === false) {
      await sendFreshVerificationEmail(email);
      return res.status(403).json({
        message: 'Email not verified. A new verification link has been sent to your email.'
      });
    }
  }

  next();
});

// Provide a simple browser-entry route for Google social sign-in so the
// browser performs a top-level navigation and Better Auth's state cookie is
// set by the server-side flow (Set-Cookie on a navigational response).
app.get('/api/auth/sign-in/google', async (req, res) => {
  try {
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

app.use('/api/auth', authHandler);

app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);

export default app;

