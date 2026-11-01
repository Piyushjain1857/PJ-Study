/**
 * Email templates for PJ Study academic platform.
 * Follows the PJ Study editorial brand aesthetic (Instrument Serif style, forest green, warm cream).
 */

/**
 * Common HTML wrapper with PJ Study editorial styling.
 *
 * @param {string} title
 * @param {string} contentHtml
 * @returns {string}
 */
function wrapEmailLayout(title, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | PJ Study</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F9F8F6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #191B18;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F9F8F6;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E6E3DC;
      border-radius: 12px;
      padding: 40px 32px;
      box-shadow: 0 4px 16px rgba(25, 27, 24, 0.04);
    }
    .header {
      border-bottom: 2px solid #285943;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .brand {
      font-size: 26px;
      font-weight: 700;
      color: #285943;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .tagline {
      display: block;
      font-size: 13px;
      color: #74756F;
      margin-top: 4px;
      font-style: italic;
    }
    h1 {
      font-size: 22px;
      color: #191B18;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin: 0 0 16px 0;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #285943;
      color: #FFFFFF !important;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      letter-spacing: 0.2px;
    }
    .btn:hover {
      background-color: #214936;
    }
    .link-fallback {
      font-size: 12px;
      word-break: break-all;
      color: #74756F;
      background-color: #F9F8F6;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #E6E3DC;
      margin-top: 24px;
    }
    .link-fallback a {
      color: #285943;
    }
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #E6E3DC;
      font-size: 12px;
      color: #8C8E87;
      text-align: center;
      line-height: 1.5;
    }
    .security-note {
      font-size: 13px;
      color: #6B7280;
      background: #F3F4F6;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="brand">PJ Study</span>
        <span class="tagline">Your Entire Study World, One Place.</span>
      </div>
      ${contentHtml}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} PJ Study. Built for scholars, students, and educators worldwide.</p>
        <p>This is an automated operational communication regarding your academic account.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates email content for account email verification.
 *
 * @param {{ name: string, verificationUrl: string, expiresIn?: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderEmailVerificationTemplate({ name, verificationUrl, expiresIn = '24 hours' }) {
  const subject = 'Verify your email address - PJ Study';

  const html = wrapEmailLayout(
    'Verify Your Email',
    `
    <h1>Welcome to PJ Study, ${name || 'Scholar'}!</h1>
    <p>Thank you for joining our academic community. To unlock your full student dashboard, download verified study notes, and share materials, please confirm your email address.</p>
    
    <div class="btn-container">
      <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify My Email</a>
    </div>

    <div class="security-note">
      <strong>Important:</strong> This verification link will expire in <strong>${expiresIn}</strong>. If you did not create an account on PJ Study, you can safely ignore this email.
    </div>

    <div class="link-fallback">
      <p style="margin: 0 0 6px 0;">If the button above does not work, copy and paste this link into your browser:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    </div>
    `
  );

  const text = `Welcome to PJ Study, ${name || 'Scholar'}!

Please verify your email address to complete your registration:
${verificationUrl}

This link is valid for ${expiresIn}.
If you did not register for an account on PJ Study, please ignore this email.

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates email content for password reset requests.
 *
 * @param {{ name: string, resetUrl: string, expiresIn?: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderPasswordResetTemplate({ name, resetUrl, expiresIn = '15 minutes' }) {
  const subject = 'Reset your password - PJ Study';

  const html = wrapEmailLayout(
    'Reset Your Password',
    `
    <h1>Password Reset Request</h1>
    <p>Hello ${name || 'Scholar'},</p>
    <p>We received a request to reset the password for your PJ Study account. Click the secure button below to choose a new password.</p>
    
    <div class="btn-container">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
    </div>

    <div class="security-note">
      <strong>Security Notice:</strong> This link is single-use and will expire in <strong>${expiresIn}</strong>.
      If you did not request this password reset, please ignore this message. Your password will remain unchanged and your account is secure.
    </div>

    <div class="link-fallback">
      <p style="margin: 0 0 6px 0;">If the button does not work, copy and paste this link into your browser:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    </div>
    `
  );

  const text = `Hello ${name || 'Scholar'},

We received a request to reset the password for your PJ Study account.
Click the link below to set a new password:
${resetUrl}

This link is valid for ${expiresIn} and can only be used once.
If you did not request a password reset, you can safely disregard this email.

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}
