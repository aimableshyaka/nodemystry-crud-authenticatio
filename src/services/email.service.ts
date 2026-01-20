// src/services/email.service.ts
import nodemailer from 'nodemailer';
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

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `"Klab Shop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  console.log('📧 Attempting to send email to:', options.to);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return;
  } catch (error: any) {
    console.error('❌ Primary SMTP send failed');
    console.error('Error Code:', error?.code);
    console.error('Error Message:', error?.message);

    // Fallback: try Gmail secure SMTP (465)
    if (error?.code === 'ETIMEDOUT' || /timeout|ECONN/i.test(error?.message || '')) {
      console.warn('⚠️ Connection timeout detected. Retrying with Gmail secure SMTP (465)...');
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: { rejectUnauthorized: false },
      });

      try {
        const info2 = await fallbackTransporter.sendMail(mailOptions);
        console.log('✅ Email sent via fallback transporter:', info2.messageId);
        return;
      } catch (fallbackErr: any) {
        console.error('❌ Fallback SMTP also failed');
        console.error('Fallback Error Code:', fallbackErr?.code);
        console.error('Fallback Error Message:', fallbackErr?.message);
        throw new Error(`Failed to send email: ${fallbackErr?.message || error?.message}`);
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