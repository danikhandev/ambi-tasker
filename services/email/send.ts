/**
 * Email Sending Service for Ambi Tasker
 */

import nodemailer from "nodemailer";
import { getEmailTransporter, EMAIL_CONFIG } from "./config";
import {
  getOTPVerificationTemplate,
  getWelcomeTemplate,
  getPasswordResetTemplate,
  getTeamInvitationTemplate,
  getTeamMemberCredentialsTemplate,
  getKYCApprovedTemplate,
  getKYCRejectedTemplate,
  getAdminOTPTemplate,
} from "./templates";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send Email
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const transporter = await getEmailTransporter();

    if (!transporter) {
      throw new Error("Email transporter not configured");
    }

    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      html,
      text,
    });

    console.log("✅ Email sent:", info.messageId);

    // Preview URL for Ethereal
    if (process.env.NODE_ENV === "development" && info.messageId.includes("ethereal")) {
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error };
  }
}

/**
 * Send OTP Verification Email
 */
export async function sendOTPEmail(to: string, name: string, otp: string) {
  const template = getOTPVerificationTemplate(name, otp);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send Welcome Email
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const template = getWelcomeTemplate(name, `${loginUrl}/login`);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(to: string, name: string, otp: string) {
  const template = getPasswordResetTemplate(name, otp);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send Team Invitation Email
 */
export async function sendTeamInvitationEmail(
  to: string,
  token: string,
  teamName: string,
  inviterName: string = "Team Admin"
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  // Extract role from any additional context if needed, default to "Team Member"
  const role = "Team Member";

  const template = getTeamInvitationTemplate(inviterName, teamName, role, inviteUrl);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send Team Member Credentials Email
 */
export async function sendTeamCredentialsEmail(
  to: string,
  name: string,
  teamName: string,
  password: string,
  role: string,
  inviterName: string
) {
  const template = getTeamMemberCredentialsTemplate(
    name,
    teamName,
    to,
    password,
    role,
    inviterName
  );
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send KYC Status Email (Approval or Rejection)
 */
export async function sendKYCStatusEmail(to: string, name: string, status: "VERIFIED" | "REJECTED", reason?: string) {
  const template = status === "VERIFIED" 
    ? getKYCApprovedTemplate(name) 
    : getKYCRejectedTemplate(name, reason);
    
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send Admin Login OTP Email
 */
export async function sendAdminOTPEmail(to: string, name: string, otp: string) {
  const template = getAdminOTPTemplate(name, otp);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
