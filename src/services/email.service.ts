// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { transporter } from '../config/email.config';
import { 
  welcomeEmailTemplate, 
  passwordResetTemplate,
  orderConfirmationTemplate 
} from '../templates/email.templates';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Resend for production (HTTP-based, no SMTP blocking)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `"Klab Shop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  console.log('📧 Attempting to send email to:', options.to);
  console.log('📧 From:', mailOptions.from);
  
  // Strategy 1: Try Resend (HTTP-based) for production - bypasses SMTP blocking
  if (resend && process.env.NODE_ENV === 'production') {
    try {
      console.log('🚀 Using Resend API (production)');
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || 'Klab Shop <onboarding@resend.dev>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Email sent via Resend:', data?.id);
      return;
    } catch (error: any) {
      console.error('❌ Resend failed, trying SMTP fallback:', error.message);
      // Fall through to SMTP attempts
    }
  }

  // Strategy 2: Try primary SMTP (port 587) - works locally
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via SMTP (port 587):', info.messageId);
    return;
  } catch (error: any) {
    console.error('❌ Primary SMTP send failed (Port 587)');
    console.error('Error Code:', error?.code);
    console.error('Error Message:', error?.message);

    // Strategy 3: Try secure SMTP (port 465)
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNECTION' || /timeout|ECONN|ESOCKET/i.test(error?.message || '')) {
      console.warn('⚠️ Connection issue detected. Trying fallback: Gmail secure SMTP (port 465)...');
      
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { 
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
      });

      try {
        const info2 = await fallbackTransporter.sendMail(mailOptions);
        console.log('✅ Email sent via secure fallback (port 465):', info2.messageId);
        return;
      } catch (fallbackErr: any) {
        console.error('❌ Fallback SMTP (port 465) also failed');
        console.error('Fallback Error Code:', fallbackErr?.code);
        console.error('Fallback Error Message:', fallbackErr?.message);
        
        // Log diagnostic info
        console.error('📋 Diagnostic Info:');
        console.error('   - Email User:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not Set');
        console.error('   - Email Password:', process.env.EMAIL_PASSWORD ? '✓ Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : '✗ Not Set');
        console.error('   - Resend API Key:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not Set (recommended for production)');
        console.error('   - Platform: Cloud/Render likely blocking SMTP ports');
        console.error('   - Solution: Set RESEND_API_KEY environment variable on Render');
        
        throw new Error(`Email delivery failed on all transports. Last error: ${fallbackErr?.message || error?.message}`);
      }
    }

    throw new Error(`Failed to send email: ${error?.message}`);
  }
};

export const sendWelcomeEmail = async (
  email: string, 
  firstName: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Our Platform!',
    html: welcomeEmailTemplate(firstName, email),
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: passwordResetTemplate(firstName, resetToken),
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  firstName: string,
  orderId: string,
  total: number
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: orderConfirmationTemplate(firstName, orderId, total),
  });
};