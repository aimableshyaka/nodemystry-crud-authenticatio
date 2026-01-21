/**
 * EMAIL INTEGRATION QUICK REFERENCE
 * Use this guide to integrate emails into other controllers
 */

// ============================================
// 1. PASSWORD RESET CONTROLLER EXAMPLE
// ============================================

// At the top of your controller file
import { sendPasswordResetEmail } from '../services/email.service';
import { generateResetToken } from '../utils/jwt.helper';

// In your forgot-password endpoint
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: "User with this email not found",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateResetToken({
      userId: user._id.toString(),
      type: 'password-reset',
    });

    // Save reset token hash to user (optional but recommended)
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email asynchronously
    sendPasswordResetEmail(user.email, user.firstname, resetToken).catch((error) => {
      console.error('Password reset email failed:', error);
    });

    return res.status(200).json({
      message: "Password reset link sent to your email",
      email: user.email,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Failed to send reset email",
      details: error.message,
    });
  }
};

// ============================================
// 2. ORDER CONFIRMATION CONTROLLER EXAMPLE
// ============================================

import { sendOrderConfirmationEmail } from '../services/email.service';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, items, total } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create order
    const order = await Order.create({
      userId,
      items,
      total,
      status: 'processing',
    });

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(
      user.email,
      user.firstname,
      order._id.toString(),
      total,
      items.length
    ).catch((error) => {
      console.error('Order confirmation email failed:', error);
      // Order still succeeds even if email fails
    });

    return res.status(201).json({
      message: "Order created successfully. Check your email for confirmation.",
      order,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
};

// ============================================
// 3. CUSTOM EMAIL TEMPLATE EXAMPLE
// ============================================

// Add to src/templates/email.templates.ts
export const customEmailTemplate = (userName: string, customContent: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Custom Email</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hello ${userName}</h1>
        </div>
        <div class="content">
          ${customContent}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Add to src/services/email.service.ts
export const sendCustomEmail = async (
  email: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

// ============================================
// 4. TESTING EMAIL FUNCTIONALITY
// ============================================

// Example test case with Jest
import { sendWelcomeEmail } from '../services/email.service';

describe('Email Service', () => {
  it('should send welcome email', async () => {
    const email = 'test@example.com';
    const firstName = 'John';

    // This will actually send an email
    await sendWelcomeEmail(email, firstName);

    // Add assertions based on your setup
  });
});

// ============================================
// 5. ENVIRONMENT VARIABLES REQUIRED
// ============================================

/**
 * Required in .env file:
 * 
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_SECURE=false
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASSWORD=your-app-password
 * EMAIL_FROM=your-email@gmail.com
 * EMAIL_FROM_NAME=Your Company
 * APP_URL=http://localhost:3000
 */

// ============================================
// 6. ERROR HANDLING PATTERNS
// ============================================

// Pattern 1: Log but don't fail user operation
sendWelcomeEmail(email, firstName).catch((error) => {
  console.error('Email failed:', error);
  // Operation succeeds regardless
});

// Pattern 2: Retry logic (for critical emails)
const sendEmailWithRetry = async (
  emailFn: () => Promise<void>,
  maxRetries = 3
): Promise<void> => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await emailFn();
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Email attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
};

// Usage:
// await sendEmailWithRetry(() => sendWelcomeEmail(email, firstName));

// ============================================
// 7. MONITORING & LOGGING
// ============================================

// All emails are logged to console with:
// ✅ Email sent successfully to user@email.com | Message ID: <id>
// ❌ Email sending failed to user@email.com: <error>

// For production, integrate with monitoring service:
// - Sentry for error tracking
// - LogRocket for user session replay
// - DataDog for metrics

// ============================================
// 8. RATE LIMITING (OPTIONAL)
// ============================================

// Add to your utils:
const emailRateLimit = new Map<string, number[]>();

export const checkEmailRateLimit = (email: string, limit = 5): boolean => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const timestamps = emailRateLimit.get(email) || [];
  const recentEmails = timestamps.filter(t => t > oneHourAgo);

  if (recentEmails.length >= limit) {
    return false; // Rate limited
  }

  recentEmails.push(now);
  emailRateLimit.set(email, recentEmails);
  return true; // Allowed
};

// Usage in controller:
// if (!checkEmailRateLimit(user.email)) {
//   return res.status(429).json({ error: "Too many emails sent" });
// }
