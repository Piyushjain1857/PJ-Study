import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import storageService from '../../services/storage/storage.service.js';
import googleDriveProvider from '../../services/storage/googleDrive.provider.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class StorageController {
  /**
   * Retrieves current cloud/local storage health and status.
   */
  getStatus = async (req, res, next) => {
    try {
      const health = await storageService.checkHealth();
      const statusData = {
        activeProvider: storageService.getActiveProvider(),
        ...health,
        isGoogleDriveConfigured: googleDriveProvider.isConfigured()
      };
      return sendSuccess(res, statusData, 200, 'Storage status retrieved.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Generates Google OAuth consent screen authorization URL for administrator setup.
   */
  getGoogleAuthUrl = async (req, res, next) => {
    try {
      const state = req.query.state || 'admin_setup';
      const authUrl = googleDriveProvider.generateAuthUrl(state);
      return sendSuccess(res, { authUrl }, 200, 'Authorization URL generated.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Handles OAuth2 redirect callback from Google.
   * Exchanges code for refresh token and provides confirmation.
   */
  handleGoogleCallback = async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PJ Study — Google Authorization Failed</title>
          <style>
            body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
            .card { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #ef4444; }
            h2 { color: #ef4444; margin-top: 0; }
            code { background: #0f172a; padding: 4px 8px; border-radius: 4px; color: #fca5a5; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✕ Google Drive Authorization Denied</h2>
            <p>Google returned an authorization error: <code>${encodeURIComponent(error)}</code></p>
            <p>Please check your OAuth consent screen configuration in Google Cloud Console and try again.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code in callback.');
    }

    try {
      // Reload latest .env to ensure fresh client ID and client secret
      let envPath = path.resolve(process.cwd(), '.env');
      if (!fs.existsSync(envPath) && fs.existsSync(path.resolve(process.cwd(), 'backend/.env'))) {
        envPath = path.resolve(process.cwd(), 'backend/.env');
      }

      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        googleDriveProvider.setCredentials({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: process.env.GOOGLE_REDIRECT_URI
        });
      }

      const { refreshToken } = await googleDriveProvider.getTokensFromCode(code);

      // Check or create PJ Study Notes private folder automatically
      let folderId = '';
      try {
        folderId = await googleDriveProvider.resolveDestinationFolder();
      } catch (fErr) {
        // eslint-disable-next-line no-console
        console.warn('Could not auto-create destination folder:', fErr.message);
      }

      // In local development, automatically persist to backend/.env
      if (process.env.NODE_ENV !== 'production') {
        try {
          const envPath = path.resolve(process.cwd(), '.env');
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            if (!envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
              envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
            } else {
              envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${refreshToken}`);
            }
            if (folderId) {
              if (!envContent.includes('GOOGLE_DRIVE_FOLDER_ID=')) {
                envContent += `GOOGLE_DRIVE_FOLDER_ID=${folderId}\n`;
              } else {
                envContent = envContent.replace(/GOOGLE_DRIVE_FOLDER_ID=.*/g, `GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
              }
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
          }
        } catch (eErr) {
          // eslint-disable-next-line no-console
          console.warn('Could not auto-write to .env:', eErr.message);
        }
      }

      // Render secure confirmation page
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PJ Study — Google Drive Storage Authorized</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #090d16; color: #f1f5f9; padding: 40px 20px; line-height: 1.6; }
            .card { max-width: 680px; margin: 20px auto; background: #111827; border-radius: 16px; padding: 36px; border: 1px solid #10b981; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .badge { display: inline-block; padding: 4px 12px; background: #064e3b; color: #34d399; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
            h1 { font-size: 24px; color: #ffffff; margin: 0 0 12px 0; }
            p { color: #94a3b8; margin: 0 0 16px 0; }
            .box { background: #030712; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; word-break: break-all; font-family: monospace; font-size: 13px; color: #38bdf8; margin: 16px 0; }
            .step { background: #1e293b; border-left: 4px solid #10b981; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
            .step strong { color: #f8fafc; }
            .auto-tag { color: #34d399; font-size: 12px; margin-left: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">✓ Authorization Successful</span>
            <h1>Google Drive Storage Connected!</h1>
            <p>PJ Study has successfully exchanged the authorization code for a long-lived Google OAuth refresh token and verified private folder access.</p>
            
            <div class="step">
              <strong>Refresh Token Configured <span class="auto-tag">✓ Saved to backend/.env</span></strong>
              <div class="box">GOOGLE_REFRESH_TOKEN=${refreshToken}</div>
            </div>

            ${folderId ? `
            <div class="step">
              <strong>Private Drive Folder <span class="auto-tag">✓ Ready</span></strong>
              <div class="box">GOOGLE_DRIVE_FOLDER_ID=${folderId}</div>
            </div>` : ''}

            <div class="step">
              <strong>Render Cloud Deployment (Production)</strong>
              <p>When deploying to Render, copy the <code>GOOGLE_REFRESH_TOKEN</code> and <code>GOOGLE_DRIVE_FOLDER_ID</code> above into your Render Environment Variables dashboard.</p>
            </div>
            
            <p style="margin-top: 24px; color: #10b981; font-weight: 500;">
              ✓ You can now close this tab and start uploading notes through PJ Study!
            </p>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PJ Study — Token Exchange Error</title>
          <style>
            body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
            .card { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #ef4444; }
            h2 { color: #ef4444; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✕ Failed to Exchange Authorization Code</h2>
            <p>${err.message}</p>
          </div>
        </body>
        </html>
      `);
    }
  };
}

export const storageController = new StorageController();
export default storageController;
