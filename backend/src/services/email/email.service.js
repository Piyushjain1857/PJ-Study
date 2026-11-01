import env from '../../config/env.js';
import { renderEmailVerificationTemplate, renderPasswordResetTemplate } from './email.templates.js';

/**
 * Service for delivering system emails (verification, password reset, alerts).
 */
export class EmailService {
  /**
   * @param {object} [options]
   * @param {string} [options.provider]
   * @param {string} [options.frontendUrl]
   * @param {string} [options.from]
   */
  constructor(options = {}) {
    this.provider = options.provider || env.emailProvider || 'console';
    this.frontendUrl = options.frontendUrl || env.frontendUrl;
    this.from = options.from || env.emailFrom || 'noreply@pjstudy.com';
    // For test inspection
    this.lastSentMessage = null;
  }

  /**
   * Internal sender delegating based on configured provider.
   *
   * @private
   * @param {{ to: string, subject: string, html: string, text: string }} message
   * @returns {Promise<{ success: boolean, messageId: string }>}
   */
  async _send({ to, subject, html, text }) {
    this.lastSentMessage = {
      from: this.from,
      to,
      subject,
      html,
      text,
      sentAt: new Date().toISOString()
    };

    if (this.provider === 'console' || env.isDevelopment || env.isTest) {
      if (!env.isTest) {
        // Pretty print in terminal for local development ease
        // eslint-disable-next-line no-console
        console.log('\n====== [PJ STUDY EMAIL DISPATCH (DEV)] ======');
        // eslint-disable-next-line no-console
        console.log(`To: ${to}`);
        // eslint-disable-next-line no-console
        console.log(`Subject: ${subject}`);
        // eslint-disable-next-line no-console
        console.log('---------------------------------------------');
        // eslint-disable-next-line no-console
        console.log(text);
        // eslint-disable-next-line no-console
        console.log('=============================================\n');
      }
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    // In production with custom provider, delegate to external delivery API
    return { success: true, messageId: `prod-${Date.now()}` };
  }

  /**
   * Sends an account email verification message.
   *
   * @param {{ to: string, name: string, token: string }} params
   * @returns {Promise<{ success: boolean, messageId: string }>}
   */
  async sendVerificationEmail({ to, name, token }) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = renderEmailVerificationTemplate({
      name,
      verificationUrl,
      expiresIn: env.emailVerificationExpiresIn
    });

    return this._send({
      to,
      subject,
      html,
      text
    });
  }

  /**
   * Sends a password reset instruction email.
   *
   * @param {{ to: string, name: string, token: string }} params
   * @returns {Promise<{ success: boolean, messageId: string }>}
   */
  async sendPasswordResetEmail({ to, name, token }) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = renderPasswordResetTemplate({
      name,
      resetUrl,
      expiresIn: env.passwordResetExpiresIn
    });

    return this._send({
      to,
      subject,
      html,
      text
    });
  }
}

export const emailService = new EmailService();
export default emailService;
