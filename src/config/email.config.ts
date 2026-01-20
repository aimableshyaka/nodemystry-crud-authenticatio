// src/config/email.config.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with aggressive timeout settings for cloud environments
export const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service for better compatibility
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
  connectionTimeout: 10000, // 10 seconds - more aggressive for cloud
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 15000, // 15 seconds
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
    ciphers: 'SSLv3', // More permissive for cloud environments
  },
  pool: true, // Use connection pooling
  maxConnections: 5, // Max simultaneous connections
  maxMessages: 10, // Max messages per connection
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Configuration Error:', error.message);
    console.error('📧 Email User:', process.env.EMAIL_USER);
    console.error('🌐 Email Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.error('🔌 Email Port:', process.env.EMAIL_PORT || '587');
    console.warn('⚠️ Note: On Render/cloud platforms, port 587 may be blocked. Fallback to port 465 will be attempted on errors.');
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('📧 Email User:', process.env.EMAIL_USER);
  }
});