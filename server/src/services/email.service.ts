import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '../config/env.js';

let sesClient: SESClient | null = null;
const fromEmail = env.AWS_SES_FROM_EMAIL || 'no-reply@lablink.com';

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION) {
  sesClient = new SESClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn('⚠️ AWS SES credentials are not fully configured. Email service will run in MOCK mode.');
}

export const emailService = {
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const subject = 'Verify your LabLink AI Account';
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to LabLink AI</h2>
        <p>Thank you for registering. Please verify your email address by using the 6-digit code below:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f1f5f9; border-radius: 6px; text-align: center; margin: 20px 0; color: #0f172a;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not create a LabLink AI account, you can safely ignore this email.</p>
      </div>
    `;
    const textContent = `Welcome to LabLink AI! Your 6-digit verification code is: ${code}. It expires in 15 minutes.`;

    if (!sesClient) {
      console.log('====================================');
      console.log(`[MOCK EMAIL] To: ${email}`);
      console.log(`[MOCK EMAIL] Subject: ${subject}`);
      console.log(`[MOCK EMAIL] Verification Code: ${code}`);
      console.log('====================================');
      return;
    }

    try {
      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Html: {
              Data: htmlContent,
            },
            Text: {
              Data: textContent,
            },
          },
        },
      });

      await sesClient.send(command);
      console.log(`Verification email sent to ${email} via AWS SES.`);
    } catch (err) {
      console.error(`Failed to send verification email to ${email} via AWS SES:`, err);
      throw err;
    }
  },

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Reset your LabLink AI Password';
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
        <p>This reset link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;
    const textContent = `Reset your LabLink AI Password by visiting this link: ${resetUrl}. It expires in 1 hour.`;

    if (!sesClient) {
      console.log('====================================');
      console.log(`[MOCK EMAIL] To: ${email}`);
      console.log(`[MOCK EMAIL] Subject: ${subject}`);
      console.log(`[MOCK EMAIL] Reset Link: ${resetUrl}`);
      console.log('====================================');
      return;
    }

    try {
      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Html: {
              Data: htmlContent,
            },
            Text: {
              Data: textContent,
            },
          },
        },
      });

      await sesClient.send(command);
      console.log(`Password reset email sent to ${email} via AWS SES.`);
    } catch (err) {
      console.error(`Failed to send password reset email to ${email} via AWS SES:`, err);
      throw err;
    }
  },
};
