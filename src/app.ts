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

  return new Request(`http://${req.headers.host}${url}`, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' && body !== undefined ? JSON.stringify(body) : undefined,
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

