/**
 * Email Service Configuration
 * Using Nodemailer with SMTP
 */

import nodemailer from "nodemailer";

// Email configuration from environment variables
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "ambitasker@gmail.com",
  fromName: process.env.EMAIL_FROM_NAME || "AmbiTasker",
  replyTo: process.env.EMAIL_REPLY_TO || "ambitasker@gmail.com",
};

// Create transporter based on environment
export const createEmailTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  // Use Gmail service if configured or as default fallback for production-like behavior
  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  // Use manual SMTP configuration if provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to Ethereal for development (creates test account)
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️  No SMTP configuration found. Using Ethereal for development."
    );
    console.log("   Required: EMAIL_USER=ambitasker@gmail.com and EMAIL_PASS=your-app-password");

    return null;
  }

  throw new Error(
    "Email configuration incomplete. Please set EMAIL_USER (ambitasker@gmail.com) and EMAIL_PASS (App Password)."
  );
};

// Get email transporter (singleton)
let transporter: nodemailer.Transporter | null = null;

export const getEmailTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  transporter = createEmailTransporter();

  // If no transporter (development mode), create Ethereal test account
  if (!transporter && process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("📧 Ethereal test account created:");
    console.log("   User:", testAccount.user);
    console.log("   Pass:", testAccount.pass);
  }

  return transporter;
};
