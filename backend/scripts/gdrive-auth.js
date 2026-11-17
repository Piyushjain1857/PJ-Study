#!/usr/bin/env node

/**
 * PJ Study — Google Drive OAuth 2.0 Authorization CLI
 * Guided one-time setup utility to obtain GOOGLE_REFRESH_TOKEN and verify private folder access.
 *
 * Usage:
 *   node scripts/gdrive-auth.js
 *   npm run gdrive:auth
 */

import readline from 'readline';
import { google } from 'googleapis';
import 'dotenv/config';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('\n================================================================');
  // eslint-disable-next-line no-console
  console.log('   PJ STUDY — GOOGLE DRIVE CLOUD STORAGE ONE-TIME AUTHORIZATION');
  // eslint-disable-next-line no-console
  console.log('================================================================\n');

  const rl = createInterface();

  try {
    // 1. Client ID
    let clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      clientId = await ask(rl, 'Enter your Google OAuth Client ID:\n> ');
      clientId = clientId.trim();
    } else {
      // eslint-disable-next-line no-console
      console.log(`✓ Using GOOGLE_CLIENT_ID from environment: ${clientId.slice(0, 15)}...`);
    }

    if (!clientId) {
      // eslint-disable-next-line no-console
      console.error('✕ Error: Client ID is required.');
      process.exit(1);
    }

    // 2. Client Secret
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      clientSecret = await ask(rl, 'Enter your Google OAuth Client Secret:\n> ');
      clientSecret = clientSecret.trim();
    } else {
      // eslint-disable-next-line no-console
      console.log('✓ Using GOOGLE_CLIENT_SECRET from environment');
    }

    if (!clientSecret) {
      // eslint-disable-next-line no-console
      console.error('✕ Error: Client Secret is required.');
      process.exit(1);
    }

    // 3. Redirect URI
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/v1/storage/google/oauth/callback';
    // eslint-disable-next-line no-console
    console.log(`\nDefault Redirect URI: ${redirectUri}`);
    // eslint-disable-next-line no-console
    console.log('Note: Ensure this Redirect URI is added under "Authorized redirect URIs" in your Google Cloud Console.');
    const customUri = await ask(rl, `Press ENTER to keep "${redirectUri}", or paste custom URI:\n> `);
    if (customUri.trim()) {
      redirectUri = customUri.trim();
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 4. Generate Auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES
    });

    // eslint-disable-next-line no-console
    console.log('\n----------------------------------------------------------------');
    // eslint-disable-next-line no-console
    console.log('STEP 1: Open this URL in your browser:');
    // eslint-disable-next-line no-console
    console.log('----------------------------------------------------------------\n');
    // eslint-disable-next-line no-console
    console.log(authUrl);
    // eslint-disable-next-line no-console
    console.log('\n----------------------------------------------------------------');
    // eslint-disable-next-line no-console
    console.log('STEP 2: Sign in with the Google Account that will store PJ Study notes.');
    // eslint-disable-next-line no-console
    console.log('        Accept the permissions request.');
    // eslint-disable-next-line no-console
    console.log('STEP 3: If redirected to your app callback or if an authorization code is shown,');
    // eslint-disable-next-line no-console
    console.log('        copy the "code" query parameter from the browser URL bar.');
    // eslint-disable-next-line no-console
    console.log('----------------------------------------------------------------\n');

    const authCode = await ask(rl, 'Paste the authorization code here:\n> ');
    const code = authCode.trim();

    if (!code) {
      // eslint-disable-next-line no-console
      console.error('✕ Authorization code cannot be empty.');
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.log('\n⏳ Exchanging authorization code for refresh token with Google...');
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // eslint-disable-next-line no-console
      console.error('\n⚠️ Notice: Google did not return a refresh_token.');
      // eslint-disable-next-line no-console
      console.error('This happens when an app was previously authorized. Please go to:');
      // eslint-disable-next-line no-console
      console.error('  https://myaccount.google.com/permissions');
      // eslint-disable-next-line no-console
      console.error('Revoke access for this application, then re-run this script.');
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.log('✓ Successfully retrieved Google OAuth Refresh Token!');

    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 5. Check account details & verify folder
    // eslint-disable-next-line no-console
    console.log('⏳ Verifying Drive access and private "PJ Study Notes" folder...');
    const about = await drive.about.get({ fields: 'user, storageQuota' });
    const userEmail = about.data.user?.emailAddress || 'Authenticated Account';

    // Check or create PJ Study Notes folder
    let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      const q = "mimeType = 'application/vnd.google-apps.folder' and name = 'PJ Study Notes' and trashed = false";
      const existingFolder = await drive.files.list({ q, fields: 'files(id, name)' });

      if (existingFolder.data.files && existingFolder.data.files.length > 0) {
        folderId = existingFolder.data.files[0].id;
        // eslint-disable-next-line no-console
        console.log(`✓ Found existing "PJ Study Notes" private folder: ${folderId}`);
      } else {
        const createRes = await drive.files.create({
          requestBody: {
            name: 'PJ Study Notes',
            mimeType: 'application/vnd.google-apps.folder',
            description: 'Dedicated private folder for PJ Study academic documents'
          },
          fields: 'id, name'
        });
        folderId = createRes.data.id;
        // eslint-disable-next-line no-console
        console.log(`✓ Created new private "PJ Study Notes" folder: ${folderId}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`✓ Using configured folder ID: ${folderId}`);
    }

    // eslint-disable-next-line no-console
    console.log('\n================================================================');
    // eslint-disable-next-line no-console
    console.log('              GOOGLE DRIVE AUTHORIZATION COMPLETE!             ');
    // eslint-disable-next-line no-console
    console.log('================================================================\n');
    // eslint-disable-next-line no-console
    console.log(`Account Email:      ${userEmail}`);
    // eslint-disable-next-line no-console
    console.log(`Private Folder ID:  ${folderId}`);
    // eslint-disable-next-line no-console
    console.log('\nCopy and paste these exact lines into your "backend/.env" (and Render Dashboard):\n');
    // eslint-disable-next-line no-console
    console.log('----------------------------------------------------------------');
    // eslint-disable-next-line no-console
    console.log('STORAGE_PROVIDER=google_drive');
    // eslint-disable-next-line no-console
    console.log(`GOOGLE_CLIENT_ID=${clientId}`);
    // eslint-disable-next-line no-console
    console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
    // eslint-disable-next-line no-console
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    // eslint-disable-next-line no-console
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
    // eslint-disable-next-line no-console
    console.log(`GOOGLE_REDIRECT_URI=${redirectUri}`);
    // eslint-disable-next-line no-console
    console.log('----------------------------------------------------------------\n');
    // eslint-disable-next-line no-console
    console.log('✓ All notes uploaded by Admin & Super Admin will now be stored privately in Google Drive.');
    // eslint-disable-next-line no-console
    console.log('✓ Scholars can preview and download notes securely inside PJ Study.\n');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('\n✕ Authorization Error:', err.message);
  } finally {
    rl.close();
  }
}

main();
