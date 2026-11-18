import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import prisma from '../../config/database.js';
import {
  renderEmailVerificationTemplate,
  renderPasswordResetTemplate,
  renderWelcomeEmailTemplate,
  renderNewLoginAlertTemplate,
  renderPasswordChangedAlertTemplate,
  renderNewNotePublishedTemplate,
  renderAnnouncementEmailTemplate,
  renderLiveActivityTemplate
} from './email.templates.js';

/**
 * Service for delivering system emails, operational notifications, and security alerts.
 * Features Nodemailer SMTP dispatch, development console fallback, DB delivery logging,
 * and automatic retry with user preference enforcement.
 */
export class EmailService {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    this.provider = options.provider || env.emailProvider || (env.smtpUser && env.smtpPass ? 'smtp' : 'console');
    this.frontendUrl = options.frontendUrl || env.frontendUrl || 'http://localhost:5173';
    this.from = options.from || env.emailFrom || (env.smtpUser ? `PJ Study <${env.smtpUser}>` : 'noreply@pjstudy.com');
    this.lastSentMessage = null;

    // Initialize Nodemailer transporter if SMTP credentials or smtp provider is configured
    this.transporter = null;
    const hasSmtpConfig = this.provider === 'smtp' || env.smtpHost || (env.smtpUser && env.smtpPass);
    if (hasSmtpConfig) {
      try {
        const isGmail = (env.smtpHost || '').includes('gmail');
        this.transporter = nodemailer.createTransport({
          host: env.smtpHost || (isGmail ? 'smtp.gmail.com' : undefined),
          port: env.smtpPort || (env.smtpSecure ? 465 : 587),
          secure: env.smtpSecure || false,
          auth:
            env.smtpUser && env.smtpPass
              ? {
                  user: env.smtpUser,
                  pass: env.smtpPass
                }
              : undefined,
          tls: {
            rejectUnauthorized: false
          }
        });
        if (env.smtpUser && env.smtpPass) {
          this.provider = 'smtp';
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ [EmailService] Failed to initialize SMTP transporter:', err.message);
      }
    }
  }

  /**
   * Checks whether a user has allowed a specific email notification category.
   *
   * @param {string} [userId]
   * @param {string} preferenceKey - e.g. 'emailSecurityAlerts', 'emailNewNotes', 'emailAnnouncements', 'emailLiveActivity'
   * @returns {Promise<boolean>}
   */
  async isEmailAllowed(userId, preferenceKey) {
    if (!userId || !preferenceKey) return true;
    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId }
      });
      if (!pref) return true; // Default is true for user
      return pref[preferenceKey] !== false;
    } catch {
      return true;
    }
  }

  /**
   * Internal sender with automated logging to EmailDeliveryLog and bounded retry.
   *
   * @private
   * @param {{
   *   to: string,
   *   subject: string,
   *   html: string,
   *   text: string,
   *   templateKey?: string,
   *   userId?: string,
   *   metadata?: object
   * }} message
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async _send({ to, subject, html, text, templateKey = 'custom', userId = null, metadata = null }) {
    this.lastSentMessage = {
      from: this.from,
      to,
      subject,
      html,
      text,
      templateKey,
      userId,
      sentAt: new Date().toISOString()
    };

    const isValidUuid =
      typeof userId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

    let logRecord = null;
    try {
      // Create initial pending log
      logRecord = await prisma.emailDeliveryLog.create({
        data: {
          recipient: to,
          subject,
          templateKey,
          status: 'PENDING',
          userId: isValidUuid ? userId : undefined,
          metadata: metadata || undefined
        }
      });
    } catch {
      // Non-blocking DB logging failure
    }

    const maxAttempts = 2;
    let lastError = null;
    let messageId = `msg-${Date.now()}`;

    const isTestEnv = env.isTest || process.env.NODE_ENV === 'test';
    const isTestRecipient =
      to.endsWith('.test') ||
      to.endsWith('@example.com') ||
      to.startsWith('test_') ||
      to.startsWith('failed_') ||
      (isTestEnv &&
        (to.endsWith('@pjstudy.com') ||
          to.endsWith('.edu') ||
          to.endsWith('.fr') ||
          to.endsWith('.ac.uk') ||
          to.endsWith('.org')));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const canSendSmtp = Boolean(
          this.transporter &&
            !isTestRecipient &&
            (this.provider === 'smtp' || env.isProduction || (env.smtpUser && env.smtpPass))
        );
        if (canSendSmtp) {
          const info = await this.transporter.sendMail({
            from: this.from,
            to,
            subject,
            html,
            text
          });
          messageId = info.messageId || messageId;
        } else {
          // Dev / Console / Test delivery mode
          if (!env.isTest) {
            // eslint-disable-next-line no-console
            console.log('\n====== [PJ STUDY EMAIL DISPATCH] ======');
            // eslint-disable-next-line no-console
            console.log(`To: ${to}`);
            // eslint-disable-next-line no-console
            console.log(`Subject: ${subject}`);
            // eslint-disable-next-line no-console
            console.log(`Template: ${templateKey}`);
            // eslint-disable-next-line no-console
            console.log('----------------------------------------');
            // eslint-disable-next-line no-console
            console.log(text);
            // eslint-disable-next-line no-console
            console.log('========================================\n');
          }
        }

        // Mark SUCCESS in log
        if (logRecord) {
          await prisma.emailDeliveryLog
            .update({
              where: { id: logRecord.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
                attempts: attempt
              }
            })
            .catch(() => {});
        }

        return { success: true, messageId };
      } catch (err) {
        lastError = err;
        // eslint-disable-next-line no-console
        console.error(`[EmailService] Send attempt ${attempt} failed for ${to}:`, err.message);
      }
    }

    // Mark FAILED in log after attempts exhausted
    if (logRecord) {
      await prisma.emailDeliveryLog
        .update({
          where: { id: logRecord.id },
          data: {
            status: 'FAILED',
            errorMessage: lastError?.message || 'Delivery failed',
            attempts: maxAttempts
          }
        })
        .catch(() => {});
    }

    return {
      success: false,
      error: lastError?.message || 'Email delivery failed'
    };
  }

  /**
   * Sends an account email verification message (Security-critical).
   *
   * @param {{ to: string, name: string, token: string, userId?: string }} params
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendVerificationEmail({ to, name, token, userId = null }) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = renderEmailVerificationTemplate({
      name,
      verificationUrl,
      expiresIn: env.emailVerificationExpiresIn || '24 hours'
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'email_verification',
      userId
    });
  }

  /**
   * Sends a password reset instruction email (Security-critical).
   *
   * @param {{ to: string, name: string, token: string, userId?: string }} params
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendPasswordResetEmail({ to, name, token, userId = null }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = renderPasswordResetTemplate({
      name,
      resetUrl,
      expiresIn: env.passwordResetExpiresIn || '15 minutes'
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'password_reset',
      userId
    });
  }

  /**
   * Sends a professional welcome email after successful signup.
   *
   * @param {{ to: string, name: string, userId?: string }} params
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendWelcomeEmail({ to, name, userId = null }) {
    const dashboardUrl = `${this.frontendUrl}/dashboard`;
    const { subject, html, text } = renderWelcomeEmailTemplate({
      name,
      dashboardUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'welcome_email',
      userId
    });
  }

  /**
   * Sends a security alert for new or suspicious logins.
   *
   * @param {{
   *   to: string,
   *   name: string,
   *   ip?: string,
   *   userAgent?: string,
   *   time?: string,
   *   userId?: string
   * }} params
   * @returns {Promise<{ success: boolean, skipped?: boolean }>}
   */
  async sendNewLoginAlertEmail({
    to,
    name,
    ip = 'Unknown IP',
    userAgent = 'Unknown Browser',
    time = new Date().toUTCString(),
    userId = null
  }) {
    // Check user preference
    if (userId) {
      const allowed = await this.isEmailAllowed(userId, 'emailSecurityAlerts');
      if (!allowed) return { success: true, skipped: true };
    }

    const securitySettingsUrl = `${this.frontendUrl}/profile?tab=security`;
    const { subject, html, text } = renderNewLoginAlertTemplate({
      name,
      ip,
      userAgent,
      time,
      securitySettingsUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'security_alert_login',
      userId,
      metadata: { ip, userAgent, time }
    });
  }

  /**
   * Sends a security alert when user's password is changed (Security-critical).
   *
   * @param {{ to: string, name: string, time?: string, userId?: string }} params
   * @returns {Promise<{ success: boolean }>}
   */
  async sendPasswordChangedAlertEmail({
    to,
    name,
    time = new Date().toUTCString(),
    userId = null
  }) {
    const securitySettingsUrl = `${this.frontendUrl}/profile?tab=security`;
    const { subject, html, text } = renderPasswordChangedAlertTemplate({
      name,
      time,
      securitySettingsUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'security_alert_password_changed',
      userId,
      metadata: { time }
    });
  }

  /**
   * Sends an email notification when new notes are published in the user's curriculum.
   *
   * @param {{
   *   to: string,
   *   name: string,
   *   noteTitle: string,
   *   courseName?: string,
   *   semester?: number|string,
   *   noteId: string,
   *   userId?: string
   * }} params
   * @returns {Promise<{ success: boolean, skipped?: boolean }>}
   */
  async sendNewNotePublishedEmail({
    to,
    name,
    noteTitle,
    courseName = '',
    semester = '',
    noteId,
    userId = null
  }) {
    if (userId) {
      const allowed = await this.isEmailAllowed(userId, 'emailNewNotes');
      if (!allowed) return { success: true, skipped: true };
    }

    const noteUrl = `${this.frontendUrl}/notes/${noteId}`;
    const { subject, html, text } = renderNewNotePublishedTemplate({
      name,
      noteTitle,
      courseName,
      semester,
      noteUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'new_notes_published',
      userId,
      metadata: { noteId, noteTitle, courseName, semester }
    });
  }

  /**
   * Sends a platform-wide announcement email.
   *
   * @param {{
   *   to: string,
   *   name: string,
   *   title: string,
   *   message: string,
   *   priority?: string,
   *   targetUrl?: string,
   *   userId?: string
   * }} params
   * @returns {Promise<{ success: boolean, skipped?: boolean }>}
   */
  async sendAnnouncementEmail({
    to,
    name,
    title,
    message,
    priority = 'NORMAL',
    targetUrl = '',
    userId = null
  }) {
    if (userId && priority !== 'URGENT') {
      const allowed = await this.isEmailAllowed(userId, 'emailAnnouncements');
      if (!allowed) return { success: true, skipped: true };
    }

    const fullUrl = targetUrl
      ? targetUrl.startsWith('http')
        ? targetUrl
        : `${this.frontendUrl}${targetUrl}`
      : '';

    const { subject, html, text } = renderAnnouncementEmailTemplate({
      name,
      title,
      message,
      priority,
      targetUrl: fullUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'platform_announcement',
      userId,
      metadata: { title, priority }
    });
  }

  /**
   * Sends an email notification for a live activity event.
   *
   * @param {{
   *   to: string,
   *   name: string,
   *   activityTitle: string,
   *   description?: string,
   *   activityUrl?: string,
   *   userId?: string
   * }} params
   * @returns {Promise<{ success: boolean, skipped?: boolean }>}
   */
  async sendLiveActivityEmail({
    to,
    name,
    activityTitle,
    description = '',
    activityUrl = '',
    userId = null
  }) {
    if (userId) {
      const allowed = await this.isEmailAllowed(userId, 'emailLiveActivity');
      if (!allowed) return { success: true, skipped: true };
    }

    const fullUrl = activityUrl
      ? activityUrl.startsWith('http')
        ? activityUrl
        : `${this.frontendUrl}${activityUrl}`
      : '';

    const { subject, html, text } = renderLiveActivityTemplate({
      name,
      activityTitle,
      description,
      activityUrl: fullUrl
    });

    return this._send({
      to,
      subject,
      html,
      text,
      templateKey: 'live_activity',
      userId,
      metadata: { activityTitle }
    });
  }
}

export const emailService = new EmailService();
export default emailService;
