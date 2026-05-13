/**
 * Email Templates for Ambi Tasker
 * Beautiful HTML email templates with brand colors
 */

// Base email wrapper with Ambi Tasker branding
export const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ambi Tasker</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(124, 27, 168, 0.15);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Ambi Tasker
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                Pakistan's Premium Service Marketplace
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                <strong>Ambi Tasker Pakistan</strong><br>
                Connecting Talent with Needs
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ============================================================================
// OTP VERIFICATION EMAIL (After Signup)
// ============================================================================

export function getOTPVerificationTemplate(name: string, otp: string) {
  return {
    subject: "Your OTP Code – AmbiTasker",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        Welcome to Ambi Tasker, ${name}! 🎉
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Thank you for joining Ambi Tasker. To complete your registration and secure your account, please verify your email address.
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-left: 4px solid #2563EB; padding: 24px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0 0 16px 0; color: #2563EB; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          📧 Your Verification Code
        </p>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2563EB; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
          <p style="margin: 12px 0 0 0; color: #868e96; font-size: 13px;">
            This code expires in 10 minutes
          </p>
        </div>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
          <strong>🔒 Security Notice:</strong> Never share this code with anyone. Ambi Tasker staff will never ask for your verification code.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
        If you didn't create an account with Ambi Tasker, please ignore this email.
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Welcome to Ambi Tasker, ${name}!\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account with Ambi Tasker, please ignore this email.\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

export function getAdminOTPTemplate(name: string, otp: string) {
  return {
    subject: "Admin Login OTP",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        Admin Authentication 🔐
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        A login attempt was made to your Ambi Tasker Admin account. Use the code below to complete the authentication:
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-left: 4px solid #2563EB; padding: 24px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0 0 16px 0; color: #2563EB; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          🔑 Your Admin OTP
        </p>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2563EB; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
          <p style="margin: 12px 0 0 0; color: #868e96; font-size: 13px;">
            This code expires in 10 minutes
          </p>
        </div>
      </div>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.5;">
          <strong>⚠️ Critical:</strong> Never share this code with anyone. If you did not attempt to log in, please contact the security team immediately.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Security Core</strong>
      </p>
    `),
    text: `Admin Login OTP\n\nYour OTP is ${otp} (valid for 10 minutes).\n\nIf you did not attempt to log in, please contact security immediately.`,
  };
}

// ============================================================================
// WELCOME EMAIL (After Email Verification)
// ============================================================================

export function getWelcomeTemplate(name: string, loginUrl: string) {
  return {
    subject: "Welcome to Ambi Tasker - Let's Get Started! 🚀",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        🎉 Welcome Aboard, ${name}!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Your email has been successfully verified! We're thrilled to have you join the Ambi Tasker community.
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3B82F6; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <h3 style="margin: 0 0 16px 0; color: #2563EB; font-size: 18px; font-weight: 600;">
          ✨ What's Next?
        </h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #495057; font-size: 15px; line-height: 1.8;">
          <li style="margin-bottom: 8px;">Find experts for any task at home</li>
          <li style="margin-bottom: 8px;">Explore verified service professionals in your area</li>
          <li style="margin-bottom: 8px;">Book appointments seamlessly</li>
          <li style="margin-bottom: 8px;">Get your tasks done with peace of mind</li>
        </ul>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Continue to Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #d1f2eb; border-left: 4px solid #28a745; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.5;">
          <strong>💡 Pro Tip:</strong> Complete your profile to get personalized recommendations and faster service booking.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
        If you have any questions or need assistance, our support team is here to help!
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Welcome to Ambi Tasker, ${name}!\n\nYour email has been successfully verified!\n\nWhat's next:\n- Find experts for any task\n- Explore verified pros\n- Book appointments\n- Get tasks done\n\nLogin here: ${loginUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

export function getPasswordResetTemplate(name: string, otp: string) {
  return {
    subject: "Your Password Reset Code – AmbiTasker",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        Password Reset Request
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        We received a request to reset the password for your Ambi Tasker account. Use the code below to reset your password:
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-left: 4px solid #2563EB; padding: 24px; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0 0 16px 0; color: #2563EB; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          🔐 Your Password Reset Code
        </p>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2563EB; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </p>
          <p style="margin: 12px 0 0 0; color: #868e96; font-size: 13px;">
            This code expires in 10 minutes
          </p>
        </div>
      </div>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.5;">
          <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. Someone may have entered your email address by mistake.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
        After entering the code, you'll be able to create a new password for your account.
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Password Reset Request\n\nHi ${name},\n\nWe received a request to reset your password.\n\nYour reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// TEAM INVITATION EMAIL
// ============================================================================

export function getTeamInvitationTemplate(
  inviterName: string,
  teamName: string,
  role: string,
  inviteUrl: string
) {
  return {
    subject: `You've been invited to join ${teamName} on Ambi Tasker`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        🎊 You've Been Invited!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join their team at <strong style="color: #2563EB;">${teamName}</strong> on Ambi Tasker.
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3B82F6; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Team Name:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${teamName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Your Role:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${role}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Invited By:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${inviterName}</span>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${inviteUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Accept Invitation →
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #d1f2eb; border-left: 4px solid #28a745; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.5;">
          <strong>✨ What you'll get:</strong><br>
          • Access to ${teamName}'s dashboard<br>
          • Collaborate with team members<br>
          • Manage service requests<br>
          • Communicate with customers
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 14px; line-height: 1.6;">
        This invitation will expire in 7 days. If you don't recognize this team or didn't expect this invitation, you can safely ignore this email.
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `You've been invited to join ${teamName}!\n\n${inviterName} has invited you to join their team on Ambi Tasker.\n\nTeam: ${teamName}\nYour Role: ${role}\nInvited By: ${inviterName}\n\nAccept invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// TEAM MEMBER CREDENTIALS EMAIL
// ============================================================================

export function getTeamMemberCredentialsTemplate(
  name: string,
  teamName: string,
  email: string,
  password: string,
  role: string,
  inviterName: string
) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    subject: `Welcome to ${teamName} - Your Account Credentials`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        🎉 Welcome to ${teamName}!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        <strong>${inviterName}</strong> has created an account for you at <strong style="color: #2563EB;">${teamName}</strong> on Ambi Tasker. You can now access the platform using the credentials below.
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3B82F6; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <p style="margin: 0 0 16px 0; color: #2563EB; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          🔐 Your Account Details
        </p>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Team Name:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${teamName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Your Role:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${role}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Email:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px; font-family: 'Courier New', monospace;">${email}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Password:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px; font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${password}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
          <strong>🔒 Security Tip:</strong> We recommend changing your password after your first login. You can do this from your account settings.
        </p>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${loginUrl}/login" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Login to Your Account →
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #d1f2eb; border-left: 4px solid #28a745; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.5;">
          <strong>✨ What you can do:</strong><br>
          • Access ${teamName}'s dashboard<br>
          • Collaborate with team members<br>
          • Manage service requests<br>
          • Chat with customers
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
        If you have any questions or need assistance, our support team is here to help!
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Welcome to ${teamName}!\n\nHi ${name},\n\n${inviterName} has created an account for you at ${teamName} on Ambi Tasker.\n\nYour Account Details:\nTeam: ${teamName}\nRole: ${role}\nEmail: ${email}\nPassword: ${password}\n\nLogin here: ${loginUrl}/login\n\nWe recommend changing your password after your first login.\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// ROOM INVITATION EMAIL (Video Call Invitation)
// ============================================================================

export function getRoomInvitationTemplate(
  taskName: string,
  inviterName: string,
  platformName: string,
  roomUrl: string,
  customMessage?: string
) {
  return {
    subject: `Video Join Request - ${taskName}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        📹 Video Support Join Request
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        <strong>${inviterName}</strong> from <strong style="color: #2563EB;">${platformName}</strong> has invited you to join a live video session for task coordination.
      </p>

      ${customMessage
        ? `
      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border-left: 4px solid #2563EB; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6; font-style: italic;">
          "${customMessage}"
        </p>
      </div>
      `
        : ""
      }

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3B82F6; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Task Name:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${taskName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Service Provider:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${platformName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #2563EB; font-size: 14px;">Invited By:</strong>
            </td>
            <td style="padding: 8px 0;">
              <span style="color: #495057; font-size: 15px;">${inviterName}</span>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${roomUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Join Video Call →
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #d1f2eb; border-left: 4px solid #28a745; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.5;">
          <strong>💡 Before you join:</strong><br>
          • Make sure you have a stable internet connection<br>
          • Allow camera and microphone permissions when prompted<br>
          • Use a quiet, well-lit environment<br>
          • Have any relevant task details ready
        </p>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
          <strong>🔒 Privacy & Security:</strong> Your video consultation is secure and private. All communications are encrypted end-to-end.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 14px; line-height: 1.6;">
        If you have any technical issues or questions, please contact ${platformName} directly.
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `You've been invited to a video call!\n\n${inviterName} from ${platformName} has invited you to join a live video session.\n\n${customMessage ? `Message: "${customMessage}"\n\n` : ""}Task: ${taskName}\nProvider: ${platformName}\nInvited By: ${inviterName}\n\nJoin here: ${roomUrl}\n\nBefore you join:\n- Stable internet connection\n- Allow camera/microphone permissions\n- Quiet, well-lit environment\n- Have task details ready\n\nYour session is secure and encrypted.\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}
// ============================================================================
// BOOKING REQUESTED EMAIL (To Provider)
// ============================================================================

export function getBookingRequestedTemplate(providerName: string, customerName: string, serviceTitle: string, scheduledAt: string, bookingUrl: string) {
  return {
    subject: `New Job Request: ${serviceTitle} - Ambi Tasker`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        ⚡ New Booking Request!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${providerName},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        You have received a new service request from <strong>${customerName}</strong> for <strong>${serviceTitle}</strong>.
      </p>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3B82F6; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #2563EB; font-size: 14px;">Customer:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${customerName}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #2563EB; font-size: 14px;">Service:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${serviceTitle}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #2563EB; font-size: 14px;">Date & Time:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${new Date(scheduledAt).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}</span></td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${bookingUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              View Job Details →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 14px; line-height: 1.6;">
        Please respond to this request as soon as possible. High responsiveness helps you get more work!
      </p>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `New Job Request: ${serviceTitle}\n\nHi ${providerName},\n\nYou have a new request from ${customerName} for ${serviceTitle} on ${new Date(scheduledAt).toLocaleString()}.\n\nView details: ${bookingUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// BOOKING ACCEPTED EMAIL (To Customer)
// ============================================================================

export function getBookingAcceptedTemplate(customerName: string, providerName: string, serviceTitle: string, scheduledAt: string, bookingUrl: string) {
  return {
    subject: `Booking Confirmed: ${serviceTitle} - Ambi Tasker`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        ✅ Your Booking is Confirmed!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${customerName},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Great news! <strong>${providerName}</strong> has accepted your booking for <strong>${serviceTitle}</strong>.
      </p>

      <div style="background: linear-gradient(135deg, rgba(40, 167, 69, 0.05) 0%, rgba(40, 167, 69, 0.1) 100%); border: 2px solid #28a745; padding: 24px; margin: 30px 0; border-radius: 10px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #28a745; font-size: 14px;">Provider:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${providerName}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #28a745; font-size: 14px;">Service:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${serviceTitle}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #28a745; font-size: 14px;">Date & Time:</strong></td>
            <td style="padding: 8px 0;"><span style="color: #495057; font-size: 15px;">${new Date(scheduledAt).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}</span></td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${bookingUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
              Track Your Booking →
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 6px;">
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
          <strong>💡 Tips:</strong> You can communicate directly with the provider using the in-app chat for any specific instructions.
        </p>
      </div>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Booking Confirmed: ${serviceTitle}\n\nHi ${customerName},\n\n${providerName} has accepted your booking for ${serviceTitle} on ${new Date(scheduledAt).toLocaleString()}.\n\nTrack booking: ${bookingUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

// ============================================================================
// BOOKING STATUS UPDATE EMAIL
// ============================================================================

export function getBookingStatusUpdateTemplate(name: string, serviceTitle: string, newStatus: string, bookingUrl: string) {
  const statusColors: any = {
    "Completed": "#28a745",
    "InProgress": "#ffc107",
    "Cancelled": "#dc3545",
    "Declined": "#dc3545"
  };
  const color = statusColors[newStatus] || "#2563EB";

  return {
    subject: `Booking Update: ${newStatus} - ${serviceTitle}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        Booking Status Update
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        The status of your booking for <strong>${serviceTitle}</strong> has been updated to:
      </p>

      <div style="background-color: ${color}10; border-left: 4px solid ${color}; padding: 24px; margin: 30px 0; border-radius: 8px; text-align: center;">
        <span style="font-size: 24px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 1px;">
          ${newStatus}
        </span>
      </div>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${bookingUrl}" style="display: inline-block; padding: 16px 40px; background-color: #212529; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Booking Details →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Best regards,<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Booking Update: ${newStatus}\n\nHi ${name},\n\nYour booking for ${serviceTitle} is now ${newStatus}.\n\nView details: ${bookingUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}
// ============================================================================
// KYC VERIFICATION TEMPLATES
// ============================================================================

export function getKYCApprovedTemplate(name: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`;
  return {
    subject: "Your Verification Status – AmbiTasker",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        ✅ Verification Successful!
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        We're excited to inform you that your professional identity and KYC documents have been successfully verified by our team. 
      </p>

      <div style="background: linear-gradient(135deg, rgba(40, 167, 69, 0.05) 0%, rgba(40, 167, 69, 0.1) 100%); border: 2px solid #28a745; padding: 24px; margin: 30px 0; border-radius: 10px; text-align: center;">
        <p style="margin: 0; color: #28a745; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Verified Professional
        </p>
      </div>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        As a verified professional on Ambi Tasker, you now have full access to:
      </p>
      <ul style="margin: 0 0 30px 20px; padding: 0; color: #495057; font-size: 15px; line-height: 1.8;">
        <li>Priority listing in search results</li>
        <li>Enhanced trust badge on your profile</li>
        <li>Ability to accept high-value job requests</li>
        <li>Direct messaging with potential customers</li>
      </ul>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Go to Your Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        Happy Tasking!<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Congratulations! Your account is verified on Ambi Tasker.\n\nHi ${name},\n\nWe're excited to inform you that your documents have been verified. You now have full access to the platform.\n\nDashboard: ${dashboardUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}

export function getKYCRejectedTemplate(name: string, reason: string = "Documents provided were unclear or incomplete.") {
  const kycUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/kyc`;
  return {
    subject: "Action Required: Verification Status – AmbiTasker",
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 26px; font-weight: 600;">
        Action Needed: Verification Status
      </h2>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Hi ${name},
      </p>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Thank you for submitting your verification documents. Unfortunately, we were unable to approve your KYC request at this time for the following reason:
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.6; font-weight: 600;">
          Reason for rejection:
        </p>
        <p style="margin: 5px 0 0 0; color: #856404; font-size: 15px; line-height: 1.6;">
          ${reason}
        </p>
      </div>

      <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
        Don't worry! You can easily re-submit your documents. Please ensure that:
      </p>
      <ul style="margin: 0 0 30px 20px; padding: 0; color: #495057; font-size: 15px; line-height: 1.8;">
        <li>All text on the documents is clearly readable</li>
        <li>The entire document is visible in the photo</li>
        <li>The information matches your profile details</li>
        <li>Documents are valid and not expired</li>
      </ul>

      <table role="presentation" style="margin: 30px 0;">
        <tr>
          <td>
            <a href="${kycUrl}" style="display: inline-block; padding: 16px 40px; background-color: #212529; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Re-submit Documents →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 30px 0 0 0; color: #495057; font-size: 16px;">
        If you have any questions, please contact our support team.<br>
        <strong style="color: #2563EB;">The Ambi Tasker Team</strong>
      </p>
    `),
    text: `Action Needed: Verification Status for Ambi Tasker.\n\nHi ${name},\n\nUnfortunately, we were unable to approve your KYC request. Reason: ${reason}\n\nPlease re-submit your documents here: ${kycUrl}\n\nBest regards,\nThe Ambi Tasker Team`,
  };
}
