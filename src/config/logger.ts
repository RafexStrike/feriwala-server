import pino from 'pino';
import pinoHttp from 'pino-http';
import { ENV } from './environment';

export const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug'
});

export const httpLogger = pinoHttp({
  logger
});
