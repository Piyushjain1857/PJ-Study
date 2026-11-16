/**
 * PJ Study Institutional Announcements Seeding Module
 * Seeds campus notices and advisories.
 */

export async function seedAnnouncements(prisma, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    announcements: { created: 0, existing: 0 }
  };

  if (mode === 'core') return { stats };

  const superAdmin = userData.primarySuperAdmin;
  if (!superAdmin) return { stats };

  const announcementsData = [
    {
      title: 'End-Term Examination Schedule & Model Solutions Published',
      message: 'The official examination schedules for B.Tech, BCA, B.Sc., MCA, and M.Tech are now live in the academic portal. Model answer kits have been attached to respective subjects.',
      targetAudience: 'ALL',
      priority: 'HIGH',
      daysBack: 5
    },
    {
      title: 'Semester 1 High-Yield Revision Notes Catalog Now Live',
      message: 'Comprehensive verified lecture notes, theorem formulary, and lab manuals have been certified by faculty leads for first-year scholars.',
      targetAudience: 'STUDENTS',
      priority: 'NORMAL',
      daysBack: 10
    },
    {
      title: 'Faculty Content Upload & Peer Review Guidelines 2025-26',
      message: 'Faculty evaluators are requested to adhere to the revised peer review rubric and KaTeX mathematical notation guidelines when approving student submissions.',
      targetAudience: 'FACULTY',
      priority: 'NORMAL',
      daysBack: 18
    },
    {
      title: 'Scheduled Cloud Infrastructure Maintenance Notice',
      message: 'Routine database index re-balancing and cloud storage snapshot backup will execute on Sunday at 02:00 AM IST with zero anticipated student downtime.',
      targetAudience: 'ALL',
      priority: 'LOW',
      daysBack: 25
    }
  ];

  const targetSpecs = mode === 'demo' ? announcementsData.slice(0, 2) : announcementsData;

  for (const ann of targetSpecs) {
    const existing = await prisma.announcement.findFirst({
      where: { title: ann.title }
    });

    if (existing) {
      stats.announcements.existing++;
    } else {
      stats.announcements.created++;
      if (!dryRun) {
        await prisma.announcement.create({
          data: {
            createdById: superAdmin.id,
            title: ann.title,
            message: ann.message,
            targetAudience: ann.targetAudience,
            priority: ann.priority,
            publishedAt: new Date(Date.now() - ann.daysBack * 86400000)
          }
        });
      }
    }
  }

  return { stats };
}
