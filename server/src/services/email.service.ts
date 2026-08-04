import { Resend } from 'resend';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const resendClient = new Resend(env.RESEND_API_KEY);
const fromEmail = env.RESEND_FROM_EMAIL || 'LabLink AI <no-reply@mail.zainch.me>';

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

    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
      logger.info(`Verification email sent to ${email} via Resend.`);
    } catch (err) {
      logger.error(`Failed to send verification email to ${email} via Resend:`, err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('⚠️ Proceeding in non-production environment despite email send failure.');
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

    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
      logger.info(`Password reset email sent to ${email} via Resend.`);
    } catch (err) {
      logger.error(`Failed to send password reset email to ${email} via Resend:`, err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('⚠️ Proceeding in non-production environment despite email send failure.');
    }
  },

  async sendStaffWelcomeEmail(email: string, name: string, password: string): Promise<void> {
    const subject = 'Welcome to LabLink AI - Staff Account Created';
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
        <p>An administrative staff account has been created for you at LabLink AI.</p>
        <p>Please use the following credentials to log in:</p>
        <div style="padding: 15px; background-color: #f1f5f9; border-radius: 6px; margin: 20px 0; color: #0f172a;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p>For security, we recommend that you change your password after logging in.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not request this account, please contact the administrator.</p>
      </div>
    `;
    const textContent = `Welcome, ${name}! Your LabLink AI staff account has been created.\nEmail: ${email}\nPassword: ${password}\nWe recommend changing your password after logging in.`;

    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
      logger.info(`Staff welcome email sent to ${email} via Resend.`);
    } catch (err) {
      logger.error(`Failed to send staff welcome email to ${email} via Resend:`, err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('⚠️ Proceeding in non-production environment despite email send failure.');
    }
  },

  async sendStaffPasswordResetEmail(email: string, name: string, password: string): Promise<void> {
    const subject = 'Your LabLink AI Password Has Been Reset';
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Password Reset by Administrator</h2>
        <p>Hello, ${name}. Your LabLink AI staff account password has been reset by an administrator.</p>
        <p>Your new temporary password is:</p>
        <div style="font-size: 24px; font-weight: bold; padding: 15px; background-color: #f1f5f9; border-radius: 6px; text-align: center; margin: 20px 0; color: #0f172a; letter-spacing: 1px;">
          ${password}
        </div>
        <p>Please log in using this temporary password and update it from your profile settings as soon as possible.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please contact the administrator immediately.</p>
      </div>
    `;
    const textContent = `Hello, ${name}. Your LabLink AI staff account password has been reset by an administrator. Your new temporary password is: ${password}. Please update your password after logging in.`;

    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
      logger.info(`Staff password reset email sent to ${email} via Resend.`);
    } catch (err) {
      logger.error(`Failed to send staff password reset email to ${email} via Resend:`, err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('⚠️ Proceeding in non-production environment despite email send failure.');
    }
  },

  async sendBookingAssignmentEmail(
    email: string,
    staffName: string,
    bookingId: string,
    scheduledAt: Date,
    patientName: string,
    address: string,
    tests: string[]
  ): Promise<void> {
    const shortId = bookingId.slice(-6).toUpperCase();
    const subject = `[LabLink AI] New Booking Assignment - #${shortId}`;
    const formattedDate = new Date(scheduledAt).toLocaleString();
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">New Booking Assignment</h2>
        <p>Hello, ${staffName}. You have been assigned to collect samples for a new booking.</p>
        
        <div style="padding: 15px; background-color: #f1f5f9; border-radius: 6px; margin: 20px 0; color: #0f172a;">
          <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Booking Details</h3>
          <p style="margin: 8px 0;"><strong>Booking Reference:</strong> #${shortId}</p>
          <p style="margin: 8px 0;"><strong>Scheduled Time:</strong> ${formattedDate}</p>
          <p style="margin: 8px 0;"><strong>Patient Name:</strong> ${patientName}</p>
          <p style="margin: 8px 0;"><strong>Collection Address:</strong> ${address}</p>
          <p style="margin: 8px 0;"><strong>Tests Required:</strong></p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            ${tests.map(t => `<li style="margin: 4px 0;">${t}</li>`).join('')}
          </ul>
        </div>
        
        <p>Please review this booking in your staff dashboard to update its status once sample collection is complete.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${env.FRONTEND_URL}/staff/dashboard?search=${bookingId}" style="background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View in Dashboard</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `;
    
    const textContent = `Hello, ${staffName}.\nYou have been assigned to collect samples for Booking #${shortId} scheduled at ${formattedDate}.\n\nPatient: ${patientName}\nAddress: ${address}\nTests to perform:\n${tests.map(t => `- ${t}`).join('\n')}\n\nView this booking on your dashboard at: ${env.FRONTEND_URL}/staff/dashboard?search=${bookingId}`;

    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
      logger.info(`Booking assignment email sent to staff ${email} for Booking #${shortId}.`);
    } catch (err) {
      logger.error(`Failed to send booking assignment email to staff ${email}:`, err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('⚠️ Proceeding in non-production environment despite email send failure.');
    }
  },
};
