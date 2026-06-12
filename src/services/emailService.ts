import nodemailer from 'nodemailer';
import { ENV } from '../config/environment';
import { logger } from '../config/logger';

const transport = nodemailer.createTransport({
  host: ENV.EMAIL_HOST,
  port: ENV.EMAIL_PORT,
  secure: ENV.EMAIL_PORT === 465,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS
  }
});

export const sendEmail = async (to: string | string[], subject: string, text: string, html?: string): Promise<void> => {
  await transport.sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
  logger.info({ to, subject }, 'Email sent');
};
