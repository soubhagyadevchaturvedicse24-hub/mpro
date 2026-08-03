import nodemailer from 'nodemailer';
import logger from '../logger/index.js';

// Create a transporter using ethereal email or any SMTP for development/production
const createTransporter = async () => {
  // If no SMTP_HOST is provided, fallback to a mock/ethereal account for local testing
  if (!process.env.SMTP_HOST) {
    logger.warn('SMTP_HOST not provided in .env, falling back to ethereal email (mocking emails).');
    
    // We can use ethereal to generate a test account if we want, or just mock it.
    // For simplicity, we just use a basic mock if no SMTP config is found.
    return {
      sendMail: async (mailOptions) => {
        logger.info(`[MOCK EMAIL SENT] To: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
        // Log the body for debugging
        logger.debug(`[MOCK EMAIL BODY]:\n${mailOptions.text}`);
        return { messageId: 'mock-id-123' };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"JeevanSetu Network" <noreply@jeevansetu.in>',
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // We don't throw here to avoid breaking workflows if email fails
    return null;
  }
};
