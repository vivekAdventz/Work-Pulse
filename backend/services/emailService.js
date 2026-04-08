import nodemailer from 'nodemailer';

// Create a transporter using standard SMTP transport
// Configured to default to Microsoft 365 (Outlook) if not otherwise specified in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for 587
  requireTLS: true, // Required for Microsoft 365
  auth: {
    // If you have MFA (Multi-Factor Authentication) enabled on Microsoft, 
    // you must use an App Password here instead of your regular password.
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  }
});

export const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Workpulse Support" <app.info@adventz.com>',
    to: toEmail,
    subject: 'Your One-Time Password (OTP) for Adventz Workpulse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e5eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e1e5eb;">
          <img src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" alt="Zuari Logo" style="height: 40px; margin-right: 15px;" />
          <img src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" alt="Adventz Logo" style="height: 40px;" />
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to Workpulse!</h2>
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            You are logging in for the first time or using a default password. To ensure your account's security, please use the following One-Time Password (OTP) to complete your login.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <div style="display: inline-block; padding: 15px 30px; background-color: #f1f5f9; border-radius: 8px; border: 2px dashed #94a3b8;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0284c7;">${otp}</span>
            </div>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            This OTP is valid for <strong>2 minutes</strong>. If you did not request this login, please contact your IT administrator immediately.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e1e5eb;">
          &copy; ${new Date().getFullYear()} Adventz Workpulse. All rights reserved.
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent: %s', info.messageId);
    
    // For test purposes, output Ethereal URL if using it
    if (transporter.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Even if it fails (due to lack of SMTP config), log the OTP to the terminal for debugging/development
    console.log(`[Development Mode] OTP for ${toEmail} is: ${otp}`);
    return false;
  }
};
