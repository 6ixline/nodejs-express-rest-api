const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Configure your email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Your App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .otp-box { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password won't change until you complete the reset process</li>
              </ul>
            </div>
            
            <p>Best regards,<br>${process.env.APP_NAME || 'Your App'} Team</p>
          </div>
        </body>
        </html>
      `,
      text: `Your password reset OTP is: ${otp}. This OTP is valid for 10 minutes. Do not share this OTP with anyone.`,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending OTP email to ${email}: ${error.message}`);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail,
};