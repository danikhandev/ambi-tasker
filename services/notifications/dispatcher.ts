import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type NotificationEvent = 
  | 'BOOKING_CREATED'
  | 'PROVIDER_ASSIGNED'
  | 'JOB_COMPLETED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'PASSWORD_RESET';

interface NotificationPayload {
  to: string;
  name: string;
  eventName: NotificationEvent;
  metadata?: any;
}

export async function dispatchNotification(payload: NotificationPayload) {
  try {
    const { to, name, eventName, metadata } = payload;
    let subject = '';
    let htmlContent = '';

    switch (eventName) {
      case 'BOOKING_CREATED':
        subject = 'Booking Confirmed - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>Your booking for <strong>${metadata?.serviceName || 'a service'}</strong> has been successfully placed.</p>
          <p>We are currently matching you with the best available professional.</p>
        `;
        break;
      case 'PROVIDER_ASSIGNED':
        subject = 'Professional Assigned - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>Great news! <strong>${metadata?.providerName || 'A professional'}</strong> has accepted your job.</p>
          <p>They will arrive at the scheduled time.</p>
        `;
        break;
      case 'JOB_COMPLETED':
        subject = 'Job Completed - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>Your job has been marked as completed.</p>
          <p>Please log in to your dashboard to review the professional and confirm the payment settlement.</p>
        `;
        break;
      case 'KYC_APPROVED':
        subject = 'KYC Approved - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>Congratulations! Your professional profile has been verified.</p>
          <p>You can now start accepting jobs on AmbiTasker.</p>
        `;
        break;
      case 'KYC_REJECTED':
        subject = 'KYC Update - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>There was an issue with your KYC documents.</p>
          <p>Please review the feedback in your dashboard and re-upload clear documents.</p>
        `;
        break;
      case 'PASSWORD_RESET':
        subject = 'Reset Your Password - AmbiTasker';
        htmlContent = `
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password.</p>
          <div style="padding: 20px; background: #f4f4f4; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Use this OTP to reset your password:</p>
            <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 5px; color: #6C63FF;">${metadata?.otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #999;">This code will expire in 10 minutes.</p>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `;
        break;
      default:
        logger.warn(`Unknown notification event: ${eventName}`);
        return false;
    }

    const mailOptions = {
      from: `"AmbiTasker System" <${process.env.SMTP_USER || 'no-reply@ambitasker.com'}>`,
      to,
      subject,
      html: htmlContent,
    };

    // If SMTP_USER is not configured, we'll just log it to avoid crashing
    if (!process.env.SMTP_USER) {
      logger.warn(`[MOCK NOTIFICATION] Event: ${eventName} to ${to}`);
      return true; // Pretend it succeeded
    }

    await transporter.sendMail(mailOptions);
    logger.info(`Notification dispatched: ${eventName} to ${to}`);
    return true;

  } catch (error) {
    logger.error('Failed to dispatch notification:', error);
    return false;
  }
}
