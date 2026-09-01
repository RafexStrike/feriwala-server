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

app.use('/api/auth', authHandler);

app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);

export default app;
