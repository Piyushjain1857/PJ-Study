/**
 * PJ Study Seeding Orchestrator
 * Coordinates modular seed engines, handles transactions, safeguards environments, and outputs structured reports.
 */

import fs from 'fs';
import path from 'path';
import { env } from '../../src/config/env.js';
import { seedAcademicCatalog } from './academic.seed.js';
import { seedUsers } from './users.seed.js';
import { seedNotes } from './notes.seed.js';
import { seedCollections } from './collections.seed.js';
import { seedBookmarks } from './bookmarks.seed.js';
import { seedReviews } from './reviews.seed.js';
import { seedReports } from './reports.seed.js';
import { seedAnalytics } from './analytics.seed.js';
import { seedAnnouncements } from './announcements.seed.js';
import { seedNotifications } from './notifications.seed.js';
import { seedSettings } from './settings.seed.js';
import { seedUiConfig } from './ui-config.seed.js';

export async function runSeeder(prisma, options = {}) {
  const { mode = 'full', dryRun = false, forceProduction = false } = options;
  const startTime = Date.now();

  // 1. Production Environmental Guard
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL || '';
  const isRemoteDb = dbUrl.includes('rds.amazonaws.com') || dbUrl.includes('cloudsql') || dbUrl.includes('railway') || dbUrl.includes('render');

  if ((isProduction || isRemoteDb) && !forceProduction) {
    if (mode !== 'core') {
      throw new Error(
        `[SECURITY HALT] Seeding mode "${mode}" is strictly prohibited in production environments. ` +
        `Only "core" reference seeding is permitted with explicit --force-production-seed flag.`
      );
    }
  }

  // 2. Core Mode Clean Slate: Purge all demo/dummy content to ensure a clean platform
  if (mode === 'core' && !dryRun) {
    await prisma.downloadHistory.deleteMany({});
    await prisma.noteViewHistory.deleteMany({});
    await prisma.reviewReport.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.reviewHelpfulVote.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.studyCollectionItem.deleteMany({});
    await prisma.studyCollection.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});

    const uploadDir = env.uploadDir || path.resolve(process.cwd(), 'uploads/notes');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const f of files) {
        if (f.startsWith('seed-')) {
          try { fs.unlinkSync(path.join(uploadDir, f)); } catch {}
        }
      }
    }
  }

  // 2. Execution in dependency order
  // Phase A: Academic Catalog
  const academic = await seedAcademicCatalog(prisma, { dryRun });

  // Phase B: Users & RBAC
  const users = await seedUsers(prisma, academic, { mode, dryRun });

  // Phase C: Platform Settings & UI Config
  const settings = await seedSettings(prisma, { dryRun });
  const ui = await seedUiConfig(prisma, { dryRun });

  // Phase D: Notes Catalog & Sample Storage Files
  const notes = await seedNotes(prisma, academic, users, { mode, dryRun });

  // Phase E: Scholar Engagements & Study Collections
  const collections = await seedCollections(prisma, notes, users, { mode, dryRun });
  const bookmarks = await seedBookmarks(prisma, notes, users, { mode, dryRun });

  // Phase F: Reviews & Ratings
  const reviews = await seedReviews(prisma, notes, users, { mode, dryRun });

  // Phase G: Moderation Queues
  const reports = await seedReports(prisma, notes, reviews, users, { mode, dryRun });

  // Phase H: Learning Analytics & Operational History
  const analytics = await seedAnalytics(prisma, notes, users, { mode, dryRun });

  // Phase I: Institutional Communications
  const announcements = await seedAnnouncements(prisma, users, { mode, dryRun });
  const notifications = await seedNotifications(prisma, users, { mode, dryRun });

  const durationMs = Date.now() - startTime;

  return {
    mode,
    dryRun,
    durationMs,
    stats: {
      universities: academic.stats.universities,
      schools: academic.stats.schools,
      courses: academic.stats.courses,
      subjects: academic.stats.subjects,
      categories: academic.stats.categories,
      users: users.stats.users,
      notes: notes.stats.notes,
      collections: collections.stats.collections,
      collectionItems: collections.stats.items,
      bookmarks: bookmarks.stats.bookmarks,
      reviews: reviews.stats.reviews,
      helpfulVotes: reviews.stats.helpfulVotes,
      noteReports: reports.stats.noteReports,
      reviewReports: reports.stats.reviewReports,
      downloads: analytics.stats.downloads,
      views: analytics.stats.views,
      auditLogs: analytics.stats.auditLogs,
      announcements: announcements.stats.announcements,
      notifications: notifications.stats.notifications,
      settings: settings.stats.settings,
      featureFlags: settings.stats.featureFlags,
      navigation: ui.stats.navigation
    }
  };
}

export function formatSeedReport(report) {
  const s = report.stats;
  const pad = (str, len) => String(str).padEnd(len);

  return `
================================================================================
                    PJ STUDY DATABASE SEED REPORT
================================================================================
Mode:        ${report.mode.toUpperCase()}
Execution:   ${report.dryRun ? 'DRY-RUN (No writes made to MySQL or storage)' : 'APPLIED (Database & storage updated)'}
Duration:    ${report.durationMs}ms

ENTITY                       CREATED       EXISTING / PRESERVED
--------------------------------------------------------------------------------
Universities                 ${pad(s.universities.created, 14)}${s.universities.existing}
Constituent Schools          ${pad(s.schools.created, 14)}${s.schools.existing}
Degree Programs              ${pad(s.courses.created, 14)}${s.courses.existing}
Curriculum Subjects          ${pad(s.subjects.created, 14)}${s.subjects.existing}
Note Categories              ${pad(s.categories.created, 14)}${s.categories.existing}
User Accounts                ${pad(s.users.created, 14)}${s.users.existing}
Academic Notes               ${pad(s.notes.created, 14)}${s.notes.existing}
Study Collections            ${pad(s.collections.created, 14)}${s.collections.existing}
Collection Items             ${pad(s.collectionItems.created, 14)}${s.collectionItems.existing}
Bookmarks                    ${pad(s.bookmarks.created, 14)}${s.bookmarks.existing}
Student Reviews              ${pad(s.reviews.created, 14)}${s.reviews.existing}
Review Helpful Votes         ${pad(s.helpfulVotes.created, 14)}${s.helpfulVotes.existing}
Content Reports              ${pad(s.noteReports.created, 14)}${s.noteReports.existing}
Review Reports               ${pad(s.reviewReports.created, 14)}${s.reviewReports.existing}
Study Downloads History      ${pad(s.downloads.created, 14)}${s.downloads.existing}
Note Reading Views           ${pad(s.views.created, 14)}${s.views.existing}
Live Audit Events            ${pad(s.auditLogs.created, 14)}${s.auditLogs.existing}
Campus Announcements         ${pad(s.announcements.created, 14)}${s.announcements.existing}
Scholar Notifications        ${pad(s.notifications.created, 14)}${s.notifications.existing}
Platform Settings            ${pad(s.settings.created, 14)}${s.settings.existing}
Feature Flags                ${pad(s.featureFlags.created, 14)}${s.featureFlags.existing}
Navigation Configurations    ${pad(s.navigation.created, 14)}${s.navigation.existing} (Updated: ${s.navigation.updated || 0})
--------------------------------------------------------------------------------
Intentionally Unseeded:      RefreshSession, EmailVerificationToken, PasswordResetToken
                             (Auth security tokens preserved empty for runtime issuance)
================================================================================
`;
}
