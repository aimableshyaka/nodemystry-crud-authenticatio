import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create and configure Nodemailer transporter for Gmail SMTP
 * Uses environment variables for credentials
 * Supports Render and other cloud deployments
 */
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // false for port 587, true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Gmail App Password (not regular password)
  },
});

/**
 * Verify SMTP connection on startup
 * This ensures email configuration is valid before runtime errors occur
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email SMTP Configuration Error:', error);
  } else {
    console.log('✅ Email SMTP Configuration Verified - Ready to send emails');
  }
});

export default transporter;
