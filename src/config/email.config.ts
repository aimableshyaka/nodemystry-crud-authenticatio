import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create and configure Nodemailer transporter for Gmail SMTP
 * Uses environment variables for credentials
 * Localhost testing configuration
 */
console.log('📧 Initializing Email Configuration...');
console.log(`   HOST: ${process.env.EMAIL_HOST}`);
console.log(`   PORT: ${process.env.EMAIL_PORT}`);
console.log(`   USER: ${process.env.EMAIL_USER}`);
console.log(`   SECURE: ${process.env.EMAIL_SECURE}`);

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
    console.error('   Please check your email credentials in .env file');
  } else {
    console.log('✅ Email SMTP Configuration Verified - Ready to send emails');
  }
});

export default transporter;
