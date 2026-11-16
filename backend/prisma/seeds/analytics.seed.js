/**
 * PJ Study Learning Analytics & Operational History Seeding Module
 * Seeds realistic 30-day download and reading velocity curves for charts and dashboards.
 */

export async function seedAnalytics(prisma, notesData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    downloads: { created: 0, existing: 0 },
    views: { created: 0, existing: 0 },
    auditLogs: { created: 0, existing: 0 }
  };

  if (mode === 'core' || !notesData.publishedNotes || notesData.publishedNotes.length === 0) {
    return { stats };
  }

  const students = userData.students.filter((s) => s.isActive);
  const staff = Object.values(userData.staff);
  if (students.length === 0) return { stats };

  const daysToSeed = mode === 'demo' ? 7 : 30;
  const downloadsPerDay = mode === 'demo' ? 3 : 8;

  // Clear existing history to prevent unbounded duplicate inflation on repeated runs
  if (!dryRun && mode === 'full') {
    await prisma.downloadHistory.deleteMany({});
    await prisma.noteViewHistory.deleteMany({});
  }

  const downloadBatches = [];
  const viewBatches = [];

  for (let day = 0; day < daysToSeed; day++) {
    const dailyCount = downloadsPerDay + ((day * 7) % 5); // Natural daily fluctuations
    for (let j = 0; j < dailyCount; j++) {
      const student = students[(day * 3 + j) % students.length];
      const note = notesData.publishedNotes[(day * 5 + j * 7) % notesData.publishedNotes.length];
      const hour = (j * 2 + 8) % 24;
      const downloadTime = new Date(Date.now() - day * 86400000 - hour * 3600000);

      downloadBatches.push({
        userId: student.id,
        noteId: note.id,
        downloadedAt: downloadTime
      });

      viewBatches.push({
        userId: student.id,
        noteId: note.id,
        viewedAt: new Date(downloadTime.getTime() - 1800000)
      });

      const peer = students[(day * 4 + j + 5) % students.length];
      viewBatches.push({
        userId: peer.id,
        noteId: note.id,
        viewedAt: downloadTime
      });
    }
  }

  stats.downloads.created = downloadBatches.length;
  stats.views.created = viewBatches.length;

  if (!dryRun) {
    await prisma.downloadHistory.createMany({ data: downloadBatches });
    await prisma.noteViewHistory.createMany({ data: viewBatches });
  }

  // Audit Logs in Full mode
  if (mode === 'full') {
    if (!dryRun) {
      await prisma.auditLog.deleteMany({});
    }

    const auditActions = [
      { action: 'NOTE_PUBLISHED', entityType: 'NOTE', desc: 'Published approved study manuscript to university catalog' },
      { action: 'USER_REGISTERED', entityType: 'USER', desc: 'New student scholar account verified and enrolled' },
      { action: 'NOTE_REVIEWED', entityType: 'REVIEW', desc: 'Verified student academic rating submitted' },
      { action: 'REPORT_RESOLVED', entityType: 'REPORT', desc: 'Resolved academic content report and notified author' },
      { action: 'SETTINGS_UPDATED', entityType: 'SETTING', desc: 'Updated platform appearance theme and navbar configurations' },
      { action: 'ANNOUNCEMENT_BROADCAST', entityType: 'ANNOUNCEMENT', desc: 'Dispatched campus-wide examination advisory' }
    ];

    const auditBatches = [];
    for (let i = 0; i < 45; i++) {
      const act = auditActions[i % auditActions.length];
      const actor = staff[i % staff.length] || userData.primarySuperAdmin;
      const note = notesData.publishedNotes[i % notesData.publishedNotes.length];
      const createdAt = new Date(Date.now() - (29 - (i % 29)) * 86400000 - ((i * 3) % 24) * 3600000);

      auditBatches.push({
        actorId: actor.id,
        action: act.action,
        entityType: act.entityType,
        entityId: note ? note.id : actor.id,
        metadata: {
          description: act.desc,
          ipAddress: `172.16.${10 + (i % 20)}.${100 + (i % 50)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        createdAt
      });
    }

    stats.auditLogs.created = auditBatches.length;
    if (!dryRun) {
      await prisma.auditLog.createMany({ data: auditBatches });
    }
  }

  return { stats };
}
