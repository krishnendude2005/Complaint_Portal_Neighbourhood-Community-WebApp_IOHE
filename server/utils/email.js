import nodemailer from 'nodemailer';

/**
 * Email service configuration
 * Uses environment variables for SMTP credentials
 */

// Create transporter based on environment configuration
export const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    // Ethereal test mode
    ETHEREAL_USER,
    ETHEREAL_PASS
  } = process.env;

  // If Ethereal credentials are provided, use them (development/testing)
  if (ETHEREAL_USER && ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: ETHEREAL_USER,
        pass: ETHEREAL_PASS
      }
    });
  }

  // Otherwise use standard SMTP configuration
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP configuration. Please set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM environment variables.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true' || false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

/**
 * Send invitation email
 */
export const sendInvitationEmail = async (toEmail, invitationLink, societyName, inviterName) => {
  const transporter = createTransporter();
  const fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Complaint Management System'}" <${fromEmail}>`,
    to: toEmail,
    subject: `Invitation to join ${societyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited!</h2>
        <p>${inviterName} has invited you to join <strong>${societyName}</strong> on our Complaint Management System.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
        <p>
          <a href="${invitationLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${invitationLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This link expires in 7 days. If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
};

/**
 * Test email configuration
 */
export const testEmailConnection = async () => {
  const transporter = createTransporter();
  return await transporter.verify();
};
