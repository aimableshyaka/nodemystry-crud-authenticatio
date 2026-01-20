// src/config/email.config.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Configuration Error:', error.message);
    console.error('Email User:', process.env.EMAIL_USER);
    console.error('Email Host:', process.env.EMAIL_HOST);
    console.error('Email Port:', process.env.EMAIL_PORT);
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('📧 Email User:', process.env.EMAIL_USER);
  }
});