/**
 * PJ Study Scholar In-App Notifications Seeding Module
 * Seeds realistic alerts and activity updates without triggering external webhooks.
 */

export async function seedNotifications(prisma, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    notifications: { created: 0, existing: 0 }
  };

  if (mode === 'core') return { stats };

  const scholar = userData.primaryScholar;
  if (!scholar) return { stats };

  const notificationsData = [
    {
      eventKey: `seed-exam-schedule-${scholar.id}`,
      type: 'ANNOUNCEMENT',
      category: 'SYSTEM',
      title: 'End-Term Examination Schedule Published',
      message: 'Examination kits and model answers are now available for your enrolled semester subjects.',
      targetUrl: '/notes',
      isRead: false,
      daysBack: 2
    },
    {
      eventKey: `seed-new-note-${scholar.id}`,
      type: 'NEW_NOTE_PUBLISHED',
      category: 'ACADEMIC',
      title: 'New Note Added to Probability & Statistics',
      message: 'Prof. Meenakshi Sundaram published Linear Algebra & Matrix Decompositions Master Guide.',
      targetUrl: '/notes',
      isRead: false,
      daysBack: 3
    },
    {
      eventKey: `seed-review-helpful-${scholar.id}`,
      type: 'REVIEW_HELPFUL',
      category: 'REVIEWS',
      title: 'Scholars Found Your Review Helpful',
      message: '3 students found your review on Python Core Problem Solving Blueprint helpful.',
      targetUrl: '/library',
      isRead: true,
      daysBack: 7
    }
  ];

  for (const notif of notificationsData) {
    const existing = await prisma.notification.findUnique({
      where: { eventKey: notif.eventKey }
    });

    if (existing) {
      stats.notifications.existing++;
    } else {
      stats.notifications.created++;
      if (!dryRun) {
        await prisma.notification.create({
          data: {
            userId: scholar.id,
            eventKey: notif.eventKey,
            type: notif.type,
            category: notif.category,
            title: notif.title,
            message: notif.message,
            targetUrl: notif.targetUrl,
            isRead: notif.isRead,
            createdAt: new Date(Date.now() - notif.daysBack * 86400000)
          }
        });
      }
    }
  }

  return { stats };
}
