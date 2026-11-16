/**
 * PJ Study Moderation Reports Seeding Module
 * Seeds realistic content reports and review reports for academic review queues.
 */

export async function seedReports(prisma, notesData, reviewData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    noteReports: { created: 0, existing: 0 },
    reviewReports: { created: 0, existing: 0 }
  };

  if (mode !== 'full' || !notesData.publishedNotes || notesData.publishedNotes.length === 0) {
    return { stats };
  }

  const students = userData.students.filter((s) => s.isActive);
  const moderator = userData.primaryAdmin;
  if (students.length === 0 || !moderator) return { stats };

  const noteReportsData = [
    {
      note: notesData.publishedNotes[0],
      reporter: students[1],
      reason: 'Outdated syllabus citation on slide 14',
      description: 'The standard library reference refers to Python 3.8 syntax rather than modern 3.12 syntax.',
      status: 'PENDING',
      daysBack: 4
    },
    {
      note: notesData.publishedNotes[2],
      reporter: students[2],
      reason: 'Formatting error on equation numbering',
      description: 'The KaTeX formula for directional gradient on page 5 renders with broken parentheses.',
      status: 'PENDING',
      daysBack: 2
    },
    {
      note: notesData.publishedNotes[3],
      reporter: students[3],
      reason: 'Missing appendix practical code',
      description: 'The laboratory experiment code for question 4 was missing from the download pack.',
      status: 'RESOLVED',
      reviewedBy: moderator,
      daysBack: 10
    },
    {
      note: notesData.publishedNotes[4],
      reporter: students[4],
      reason: 'Typographical error in Taylor series expansion',
      description: 'Minus sign inverted on the third derivative term.',
      status: 'RESOLVED',
      reviewedBy: moderator,
      daysBack: 14
    },
    {
      note: notesData.publishedNotes[5],
      reporter: students[5],
      reason: 'Claimed duplicate submission',
      description: 'Student claimed this was identical to lecture 1 notes; verified as distinct advanced material.',
      status: 'DISMISSED',
      reviewedBy: moderator,
      daysBack: 20
    },
    {
      note: notesData.publishedNotes[1],
      reporter: students[6],
      reason: 'Course code classification mismatch',
      description: 'Requested moving notes to elective folder; confirmed current core categorization is accurate.',
      status: 'DISMISSED',
      reviewedBy: moderator,
      daysBack: 25
    }
  ];

  for (const rep of noteReportsData) {
    const existing = await prisma.report.findFirst({
      where: { noteId: rep.note.id, reportedById: rep.reporter.id }
    });

    if (existing) {
      stats.noteReports.existing++;
    } else {
      stats.noteReports.created++;
      if (!dryRun) {
        await prisma.report.create({
          data: {
            noteId: rep.note.id,
            reportedById: rep.reporter.id,
            reason: rep.reason,
            description: rep.description,
            status: rep.status,
            reviewedById: rep.reviewedBy ? rep.reviewedBy.id : null,
            reviewedAt: rep.reviewedBy ? new Date(Date.now() - (rep.daysBack - 1) * 86400000) : null,
            createdAt: new Date(Date.now() - rep.daysBack * 86400000)
          }
        });
      }
    }
  }

  // Review reports
  if (reviewData.reviews && reviewData.reviews.length >= 4) {
    const reviewReportsData = [
      {
        review: reviewData.reviews[0],
        reporter: students[7],
        reason: 'SPAM',
        description: 'Review mentions external telegram group link for answer keys.',
        status: 'OPEN',
        daysBack: 3
      },
      {
        review: reviewData.reviews[1],
        reporter: students[8],
        reason: 'MISLEADING',
        description: 'Comment claims material is for 2021 curriculum when it is 2025 certified.',
        status: 'OPEN',
        daysBack: 2
      },
      {
        review: reviewData.reviews[2],
        reporter: students[9],
        reason: 'OFFENSIVE',
        description: 'Unconstructive critique targeting peer student author.',
        status: 'ACTIONED',
        reviewedBy: moderator,
        daysBack: 12
      },
      {
        review: reviewData.reviews[3],
        reporter: students[10],
        reason: 'OTHER',
        description: 'Subjective dispute over difficulty rating.',
        status: 'DISMISSED',
        reviewedBy: moderator,
        daysBack: 18
      }
    ];

    for (const rr of reviewReportsData) {
      const existing = await prisma.reviewReport.findFirst({
        where: { reviewId: rr.review.id, reporterId: rr.reporter.id }
      });

      if (existing) {
        stats.reviewReports.existing++;
      } else {
        stats.reviewReports.created++;
        if (!dryRun) {
          await prisma.reviewReport.create({
            data: {
              reviewId: rr.review.id,
              reporterId: rr.reporter.id,
              reason: rr.reason,
              description: rr.description,
              status: rr.status,
              reviewedById: rr.reviewedBy ? rr.reviewedBy.id : null,
              reviewedAt: rr.reviewedBy ? new Date(Date.now() - (rr.daysBack - 1) * 86400000) : null,
              createdAt: new Date(Date.now() - rr.daysBack * 86400000)
            }
          });
        }
      }
    }
  }

  return { stats };
}
