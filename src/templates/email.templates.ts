/**
 * Email HTML Templates
 * Production-ready email templates with consistent styling
 */

export const welcomeEmailTemplate = (firstName: string, email: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Platform</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 0;
          background-color: #f5f5f5;
        }
        .header { 
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 30px 20px; 
          background: white;
          margin: 0 20px;
        }
        .content h2 {
          color: #4CAF50;
          margin-top: 0;
        }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #4CAF50; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background: #45a049;
        }
        .info-box {
          background: #f0f8f0;
          padding: 15px;
          border-left: 4px solid #4CAF50;
          margin: 20px 0;
          border-radius: 3px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #777; 
          font-size: 12px;
          background: #f5f5f5;
          margin: 0 20px;
          border-radius: 0 0 5px 5px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Our Platform!</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>Thank you for joining us! We're thrilled to have you on board.</p>
          
          <div class="info-box">
            <strong>Account Created Successfully</strong>
            <p>Email: <strong>${email}</strong></p>
          </div>
          
          <p>You now have access to:</p>
          <ul>
            <li>Browse our complete product catalog</li>
            <li>Manage your shopping cart</li>
            <li>Track your orders in real-time</li>
            <li>Secure checkout experience</li>
          </ul>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://yourapp.com'}/login" class="button">Start Exploring</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>If you didn't create this account, please <a href="mailto:support@yourcompany.com" style="color: #4CAF50; text-decoration: none;">contact support</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetTemplate = (firstName: string, resetToken: string): string => {
  const resetUrl = `${process.env.APP_URL || 'https://yourapp.com'}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto;
          padding: 0;
          background-color: #f5f5f5;
        }
        .header { 
          background: linear-gradient(135deg, #FF6B6B, #ff5252);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 30px 20px; 
          background: white;
          margin: 0 20px;
        }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #FF6B6B; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background: #ff5252;
        }
        .warning { 
          background: #fff3cd; 
          padding: 15px; 
          border-left: 4px solid #ffc107; 
          margin: 20px 0;
          border-radius: 3px;
        }
        .warning strong {
          color: #856404;
        }
        .warning p {
          margin: 5px 0;
          color: #856404;
        }
        .link-box {
          background: #f0f0f0;
          padding: 15px;
          margin: 20px 0;
          border-radius: 3px;
          word-break: break-all;
          font-size: 12px;
          font-family: 'Courier New', monospace;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #777; 
          font-size: 12px;
          background: #f5f5f5;
          margin: 0 20px;
          border-radius: 0 0 5px 5px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>• This link will expire in <strong>1 hour</strong></p>
            <p>• If you didn't request this, you can safely ignore this email</p>
            <p>• Never share this link with anyone</p>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-box">${resetUrl}</div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>Questions? <a href="mailto:support@yourcompany.com" style="color: #FF6B6B; text-decoration: none;">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const orderConfirmationTemplate = (
  firstName: string, 
  orderId: string, 
  total: number,
  itemCount: number = 1
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto;
          padding: 0;
          background-color: #f5f5f5;
        }
        .header { 
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 30px 20px; 
          background: white;
          margin: 0 20px;
        }
        .order-details { 
          background: #f9f9f9; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 5px;
          border-left: 4px solid #2196F3;
        }
        .order-details h3 {
          margin-top: 0;
          color: #2196F3;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 18px;
          font-weight: bold;
          color: #2196F3;
          border-top: 2px solid #2196F3;
          margin-top: 10px;
        }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: #2196F3; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background: #1976D2;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #777; 
          font-size: 12px;
          background: #f5f5f5;
          margin: 0 20px;
          border-radius: 0 0 5px 5px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${firstName}!</h2>
          <p>Your order has been successfully placed and is being processed.</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <div class="detail-row">
              <span class="detail-label">Order ID:</span>
              <span class="detail-value">${orderId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #4CAF50; font-weight: bold;">Processing</span>
            </div>
            <div class="total-row">
              <span>Total Amount:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <p>🚚 What happens next?</p>
          <ul>
            <li>We're preparing your order for shipment</li>
            <li>You'll receive a tracking number when it ships</li>
            <li>Estimated delivery: 3-5 business days</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://yourapp.com'}/orders/${orderId}" class="button">Track Order</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>Questions about your order? <a href="mailto:support@yourcompany.com" style="color: #2196F3; text-decoration: none;">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};
