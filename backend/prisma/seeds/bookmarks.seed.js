/**
 * PJ Study Scholar Bookmarks Seeding Module
 * Seeds realistic bookmarks linking enrolled students to published notes.
 */

export async function seedBookmarks(prisma, notesData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    bookmarks: { created: 0, existing: 0 }
  };

  if (mode === 'core' || !notesData.publishedNotes || notesData.publishedNotes.length === 0) {
    return { stats };
  }

  const students = userData.students.filter((s) => s.isActive);
  if (students.length === 0) return { stats };

  const bookmarkTargetCount = mode === 'demo' ? 6 : 45;

  for (let i = 0; i < bookmarkTargetCount; i++) {
    const student = students[i % students.length];
    const note = notesData.publishedNotes[(i * 3 + 1) % notesData.publishedNotes.length];

    const existing = await prisma.bookmark.findFirst({
      where: { userId: student.id, noteId: note.id }
    });

    if (existing) {
      stats.bookmarks.existing++;
    } else {
      stats.bookmarks.created++;
      if (!dryRun) {
        await prisma.bookmark.create({
          data: {
            userId: student.id,
            noteId: note.id,
            createdAt: new Date(Date.now() - (20 - (i % 20)) * 86400000)
          }
        }).catch(() => {});
      }
    }
  }

  return { stats };
}
