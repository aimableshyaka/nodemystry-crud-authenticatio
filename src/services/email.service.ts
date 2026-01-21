import transporter from '../config/email.config';
import {
  welcomeEmailTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
} from '../templates/email.templates';

/**
 * Email sending options interface
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generic email sending function with error handling and logging
 * @param options - Email configuration (to, subject, html)
 * @throws Error if email sending fails
 */
const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to} | Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ Email sending failed to ${options.to}:`, error.message);
    throw new Error(`Failed to send email to ${options.to}: ${error.message}`);
  }
};

/**
 * Send welcome email to new user
 * Called after successful user registration
 * @param email - User's email address
 * @param firstName - User's first name
 */
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: '🎉 Welcome to Our Platform!',
      html: welcomeEmailTemplate(firstName, email),
    });
  } catch (error) {
    // Log error but don't throw to prevent registration from failing
    console.error('Welcome email failed:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * Called when user requests password reset
 * @param email - User's email address
 * @param firstName - User's first name
 * @param resetToken - JWT reset token (typically valid for 1 hour)
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: '🔒 Password Reset Request',
      html: passwordResetTemplate(firstName, resetToken),
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    throw error;
  }
};

/**
 * Send order confirmation email
 * Called after successful order placement
 * @param email - Customer's email address
 * @param firstName - Customer's first name
 * @param orderId - Unique order identifier
 * @param total - Order total amount
 * @param itemCount - Number of items in order (optional)
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  firstName: string,
  orderId: string,
  total: number,
  itemCount?: number
): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: `📦 Order Confirmation - #${orderId}`,
      html: orderConfirmationTemplate(firstName, orderId, total, itemCount),
    });
  } catch (error) {
    console.error('Order confirmation email failed:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
