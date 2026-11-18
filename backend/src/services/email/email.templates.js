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

/**
 * Generates email content for Welcome email upon registration.
 *
 * @param {{ name: string, dashboardUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderWelcomeEmailTemplate({ name, dashboardUrl }) {
  const subject = 'Welcome to PJ Study!';

  const html = wrapEmailLayout(
    'Welcome to PJ Study',
    `
    <h1>Welcome to Your Academic Hub, ${name || 'Scholar'}!</h1>
    <p>We are delighted to welcome you to <strong>PJ Study</strong> — your comprehensive platform for academic manuscripts, syllabus-aligned notes, exam revisions, and peer collaboration.</p>
    
    <div style="background: #F9F8F6; border: 1px solid #E6E3DC; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #285943;">What you can do on PJ Study:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #4B5563;">
        <li>Browse verified lecture notes, laboratory guides, and question papers.</li>
        <li>Organize study materials into custom binders and personal collections.</li>
        <li>Receive real-time notifications when new materials for your course are published.</li>
        <li>Access high-speed PDF previews and offline study mode on mobile.</li>
      </ul>
    </div>

    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn" target="_blank" rel="noopener noreferrer">Go to Scholar Dashboard</a>
    </div>

    <p style="font-size: 14px; color: #6B7280;">If you ever have feedback or suggestions, feel free to reply to this email or visit your account settings.</p>
    `
  );

  const text = `Welcome to Your Academic Hub, ${name || 'Scholar'}!

We are delighted to welcome you to PJ Study — your comprehensive platform for academic manuscripts, syllabus-aligned notes, and peer study.

Access your Scholar Dashboard:
${dashboardUrl}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates security alert email for new logins.
 *
 * @param {{ name: string, ip: string, userAgent: string, time?: string, securitySettingsUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderNewLoginAlertTemplate({
  name,
  ip = 'Unknown IP',
  userAgent = 'Unknown Device',
  time = new Date().toUTCString(),
  securitySettingsUrl
}) {
  const subject = 'New Login Detected – PJ Study';

  const html = wrapEmailLayout(
    'New Login Detected',
    `
    <h1>Security Alert: New Sign-In</h1>
    <p>Hello ${name || 'Scholar'},</p>
    <p>We detected a new sign-in to your PJ Study account with the following details:</p>
    
    <div style="background: #F9F8F6; border: 1px solid #E6E3DC; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-family: monospace; font-size: 13px; line-height: 1.7; color: #1F2937;">
      <div><strong>Time:</strong> ${time}</div>
      <div><strong>IP Address:</strong> ${ip}</div>
      <div><strong>Device / Browser:</strong> ${userAgent}</div>
    </div>

    <p>If this was you, you can safely disregard this alert.</p>

    <div class="security-note" style="border-left: 4px solid #DC2626; background: #FEF2F2; color: #991B1B;">
      <strong>Did not recognize this activity?</strong> Someone else may have accessed your account. We strongly recommend resetting your password immediately and reviewing your active sessions.
    </div>

    <div class="btn-container">
      <a href="${securitySettingsUrl}" class="btn" style="background-color: #DC2626;" target="_blank" rel="noopener noreferrer">Review Security Settings</a>
    </div>
    `
  );

  const text = `Security Alert: New Sign-In Detected – PJ Study

Hello ${name || 'Scholar'},

A new sign-in was detected on your PJ Study account:
Time: ${time}
IP Address: ${ip}
Device / Browser: ${userAgent}

If this was not you, please secure your account immediately:
${securitySettingsUrl}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates security alert email for password changes.
 *
 * @param {{ name: string, time?: string, securitySettingsUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderPasswordChangedAlertTemplate({
  name,
  time = new Date().toUTCString(),
  securitySettingsUrl
}) {
  const subject = 'Security Alert: Password Changed – PJ Study';

  const html = wrapEmailLayout(
    'Password Changed',
    `
    <h1>Your Password Was Successfully Changed</h1>
    <p>Hello ${name || 'Scholar'},</p>
    <p>The password for your PJ Study account was changed on <strong>${time}</strong>. All previous active refresh sessions across other devices have been automatically invalidated for your security.</p>

    <div class="security-note" style="border-left: 4px solid #DC2626; background: #FEF2F2; color: #991B1B;">
      <strong>Did not make this change?</strong> Your account credentials may have been compromised. Please use the account recovery option immediately or contact platform administrators.
    </div>

    <div class="btn-container">
      <a href="${securitySettingsUrl}" class="btn" target="_blank" rel="noopener noreferrer">Visit Account Security</a>
    </div>
    `
  );

  const text = `Security Alert: Password Changed – PJ Study

Hello ${name || 'Scholar'},

The password for your PJ Study account was updated on ${time}.
If you did not perform this change, please recover your account immediately:
${securitySettingsUrl}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates email notification when new notes are published.
 *
 * @param {{ name: string, noteTitle: string, courseName?: string, semester?: number|string, noteUrl: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderNewNotePublishedTemplate({
  name,
  noteTitle,
  courseName = 'Your Curriculum',
  semester = '',
  noteUrl
}) {
  const subject = 'New Study Notes Available – PJ Study';

  const semesterLabel = semester ? `Semester ${semester}` : '';
  const contextLabel = [courseName, semesterLabel].filter(Boolean).join(' • ');

  const html = wrapEmailLayout(
    'New Study Notes Available',
    `
    <h1>New Study Material Published!</h1>
    <p>Hello ${name || 'Scholar'},</p>
    <p>A new verified academic manuscript relevant to your curriculum has just been published on PJ Study:</p>

    <div style="background: #F9F8F6; border: 1px solid #E6E3DC; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #285943; margin-bottom: 6px;">
        ${contextLabel || 'ACADEMIC RESOURCE'}
      </div>
      <h2 style="margin: 0 0 10px 0; font-size: 19px; color: #191B18;">${noteTitle}</h2>
      <p style="margin: 0; font-size: 14px; color: #4B5563;">This note is now available for document streaming, instant in-browser preview, and study binder organization.</p>
    </div>

    <div class="btn-container">
      <a href="${noteUrl}" class="btn" target="_blank" rel="noopener noreferrer">View & Preview Notes</a>
    </div>
    `
  );

  const text = `New Study Notes Available – PJ Study

Hello ${name || 'Scholar'},

New study material is available: "${noteTitle}" (${contextLabel})

Read and preview here:
${noteUrl}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates email for platform-wide announcements.
 *
 * @param {{ name: string, title: string, message: string, priority?: string, targetUrl?: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderAnnouncementEmailTemplate({
  name,
  title,
  message,
  priority = 'NORMAL',
  targetUrl = ''
}) {
  const subject = priority === 'URGENT' ? `[URGENT] ${title} – PJ Study` : `${title} – PJ Study`;

  const html = wrapEmailLayout(
    title,
    `
    <h1>${title}</h1>
    <p>Hello ${name || 'Scholar'},</p>
    
    <div style="background: #FFFFFF; border-left: 4px solid #285943; padding: 14px 18px; margin: 20px 0; font-size: 15px; line-height: 1.6; color: #1F2937;">
      ${message.replace(/\n/g, '<br/>')}
    </div>

    ${
      targetUrl
        ? `
      <div class="btn-container">
        <a href="${targetUrl}" class="btn" target="_blank" rel="noopener noreferrer">View Details</a>
      </div>
    `
        : ''
    }
    `
  );

  const text = `${title} – PJ Study

Hello ${name || 'Scholar'},

${message}

${targetUrl ? `View Details: ${targetUrl}` : ''}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}

/**
 * Generates email for live activity updates.
 *
 * @param {{ name: string, activityTitle: string, description?: string, time?: string, activityUrl?: string }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderLiveActivityTemplate({
  name,
  activityTitle,
  description = '',
  time = new Date().toUTCString(),
  activityUrl = ''
}) {
  const subject = 'Live Activity Update – PJ Study';

  const html = wrapEmailLayout(
    'Live Activity Update',
    `
    <h1>Live Academic Activity</h1>
    <p>Hello ${name || 'Scholar'},</p>
    <p>Here is a real-time update from your academic network on PJ Study:</p>

    <div style="background: #F9F8F6; border: 1px solid #E6E3DC; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #285943;">${activityTitle}</h3>
      ${description ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #4B5563;">${description}</p>` : ''}
      <span style="font-size: 12px; color: #9CA3AF;">Recorded: ${time}</span>
    </div>

    ${
      activityUrl
        ? `
      <div class="btn-container">
        <a href="${activityUrl}" class="btn" target="_blank" rel="noopener noreferrer">Open Activity</a>
      </div>
    `
        : ''
    }
    `
  );

  const text = `Live Activity Update – PJ Study

Hello ${name || 'Scholar'},

${activityTitle}
${description}
Time: ${time}

${activityUrl ? `Link: ${activityUrl}` : ''}

--
PJ Study
Your Entire Study World, One Place.`;

  return { subject, html, text };
}
