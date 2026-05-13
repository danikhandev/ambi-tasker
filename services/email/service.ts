/**
 * Email Service
 * Send transactional emails using templates
 */

import { getEmailTransporter, EMAIL_CONFIG } from "./config";
import * as templates from "./templates";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send email using configured transporter
 */
export const sendEmail = async (options: SendEmailOptions) => {
  try {
    const transporter = await getEmailTransporter();

    if (!transporter) {
      throw new Error("Email transporter not configured");
    }

    const info = await transporter.sendMail({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
      attachments: options.attachments,
    });
    console.log("mail sent info: ", info);
    

    // Log preview URL for development (Ethereal)
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email sent:", info.messageId);
      const previewUrl = (await import("nodemailer")).getTestMessageUrl(info);
      if (previewUrl) {
        console.log("   Preview URL:", previewUrl);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ============================================================================
// TEMPLATE-BASED EMAIL SENDERS
// ============================================================================

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async (
  to: string,
  data: {
    name: string;
    clinicName: string;
    otp?: string;
    isAdminNotification?: boolean;
    vetName?: string;
    vetEmail?: string;
  }
) => {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const template = templates.getWelcomeTemplate(data.name, `${loginUrl}/login`);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
};


/**
 * Send booking request email to provider
 */
export const sendBookingRequestEmail = async (
  to: string,
  data: {
    providerName: string;
    customerName: string;
    serviceTitle: string;
    scheduledAt: string;
    bookingId: string;
  }
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl}/provider/bookings/${data.bookingId}`;
  const template = templates.getBookingRequestedTemplate(
    data.providerName,
    data.customerName,
    data.serviceTitle,
    data.scheduledAt,
    bookingUrl
  );
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
};

/**
 * Send booking accepted email to customer
 */
export const sendBookingAcceptedEmail = async (
  to: string,
  data: {
    customerName: string;
    providerName: string;
    serviceTitle: string;
    scheduledAt: string;
    bookingId: string;
  }
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl}/dashboard/bookings/${data.bookingId}`;
  const template = templates.getBookingAcceptedTemplate(
    data.customerName,
    data.providerName,
    data.serviceTitle,
    data.scheduledAt,
    bookingUrl
  );
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
};

/**
 * Send booking status update email
 */
export const sendBookingStatusUpdateEmail = async (
  to: string,
  data: {
    recipientName: string;
    serviceTitle: string;
    newStatus: string;
    bookingId: string;
    role: "customer" | "provider";
  }
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const path = data.role === "provider" ? "provider/bookings" : "dashboard/bookings";
  const bookingUrl = `${appUrl}/${path}/${data.bookingId}`;
  const template = templates.getBookingStatusUpdateTemplate(
    data.recipientName,
    data.serviceTitle,
    data.newStatus,
    bookingUrl
  );
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
};

// Export all email functions
export const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingRequestEmail,
  sendBookingAcceptedEmail,
  sendBookingStatusUpdateEmail
};

export default emailService;
