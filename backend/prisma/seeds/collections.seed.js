/**
 * PJ Study Scholar Collections Seeding Module
 * Seeds custom study binders and collection items.
 */

export async function seedCollections(prisma, notesData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    collections: { created: 0, existing: 0 },
    items: { created: 0, existing: 0 }
  };

  if (mode === 'core' || !notesData.publishedNotes || notesData.publishedNotes.length === 0) {
    return { stats };
  }

  const scholar = userData.primaryScholar;
  if (!scholar) return { stats };

  const collectionsData = [
    {
      name: 'Semester 1 High-Yield Revision Binder',
      description: 'Core lecture handouts, mathematical proofs, and model questions for first-year engineering.',
      notes: notesData.publishedNotes.filter((n) => n.semester === 1).slice(0, 4)
    },
    {
      name: 'Python & Algorithmic Problem Solving Kit',
      description: 'Algorithmic paradigms, clean code practices, and recursion blueprints.',
      notes: notesData.publishedNotes.filter((n) => n.title.includes('Python') || n.title.includes('Algorithms')).slice(0, 3)
    },
    {
      name: 'Full-Stack Web Engineering Mastery',
      description: 'HTML5, CSS layout engines, JavaScript event loops, and backend scripting guides.',
      notes: notesData.publishedNotes.filter((n) => n.title.includes('Web')).slice(0, 3)
    }
  ];

  for (const col of collectionsData) {
    const existing = await prisma.studyCollection.findFirst({
      where: { userId: scholar.id, name: col.name }
    });

    let sc;
    if (existing) {
      stats.collections.existing++;
      sc = existing;
    } else {
      stats.collections.created++;
      if (!dryRun) {
        sc = await prisma.studyCollection.create({
          data: {
            userId: scholar.id,
            name: col.name,
            description: col.description
          }
        });
      }
    }

    if (sc && !dryRun) {
      for (const n of col.notes) {
        const itemExists = await prisma.studyCollectionItem.findFirst({
          where: { collectionId: sc.id, noteId: n.id }
        });
        if (itemExists) {
          stats.items.existing++;
        } else {
          stats.items.created++;
          await prisma.studyCollectionItem.create({
            data: {
              collectionId: sc.id,
              noteId: n.id
            }
          });
        }
      }
    }
  }

  return { stats };
}
