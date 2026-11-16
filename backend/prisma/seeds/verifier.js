/**
 * PJ Study Database Seed Verification Engine
 * Validates relational integrity, physical file availability, RBAC safety, and absence of forbidden subjects.
 */

import fs from 'fs';
import path from 'path';
import { env } from '../../src/config/env.js';
import { FORBIDDEN_SUBJECT_NAMES, FORBIDDEN_CODES, FORBIDDEN_SLUGS } from './academic.seed.js';

export async function verifySeed(prisma) {
  const results = [];
  let allPassed = true;

  const recordCheck = (name, passed, details) => {
    if (!passed) allPassed = false;
    results.push({ name, passed, details });
  };

  try {
    // 1. University & Schools
    const university = await prisma.university.findUnique({ where: { slug: 'krmu' } });
    recordCheck('University Hierarchy', !!university && university.isActive, university ? `KRMU active (${university.id})` : 'Missing KRMU university');

    const schoolCount = await prisma.school.count({ where: { universityId: university?.id } });
    recordCheck('Schools Catalog', schoolCount === 11, `Found ${schoolCount}/11 constituent schools`);

    // 2. Academic Programs & Semesters
    const courses = await prisma.course.findMany({ select: { id: true, name: true, slug: true, semestersCount: true } });
    recordCheck('Degree Programs', courses.length === 5, `Found ${courses.length}/5 accredited programs (B.Tech, BCA, B.Sc., MCA, M.Tech)`);

    // 3. Forbidden Subjects Guard (Strict Invariant)
    const forbidden = await prisma.subject.findMany({
      where: {
        OR: [
          { name: { in: FORBIDDEN_SUBJECT_NAMES } },
          { code: { in: FORBIDDEN_CODES } },
          { slug: { in: FORBIDDEN_SLUGS } }
        ]
      }
    });
    recordCheck('Forbidden Subjects Guard', forbidden.length === 0, forbidden.length === 0 ? 'Zero forbidden subjects in database' : `Found ${forbidden.length} forbidden subjects (${forbidden.map((f) => f.name).join(', ')})`);

    // 4. Subject Credits Verification
    const subjectsWithoutCredits = await prisma.subject.count({ where: { credits: null } });
    recordCheck('Academic Subject Credits', subjectsWithoutCredits === 0, subjectsWithoutCredits === 0 ? 'All subjects have assigned academic credits' : `${subjectsWithoutCredits} subjects missing credits`);

    // 5. Subject Notes Coverage & Clean Slate Support
    const totalNotes = await prisma.note.count();
    if (totalNotes === 0) {
      recordCheck('Subject Notes Coverage', true, 'Clean Catalog Mode (0 dummy notes - ready for genuine uploads)');
      recordCheck('Physical File Storage', true, 'Clean Storage (0 sample mock files on disk)');
    } else {
      const subjectsWithNoNotes = await prisma.subject.findMany({
        where: { notes: { none: {} } },
        select: { name: true, course: { select: { name: true } } }
      });
      recordCheck('Subject Notes Coverage', subjectsWithNoNotes.length === 0, subjectsWithNoNotes.length === 0 ? '100% of subjects have active notes catalog' : `${subjectsWithNoNotes.length} subjects have 0 notes (${subjectsWithNoNotes.slice(0, 3).map((s) => `${s.name} in ${s.course.name}`).join('; ')}...)`);

      // 6. Physical Sample Files Verification
      const uploadDir = env.uploadDir || path.resolve(process.cwd(), 'uploads/notes');
      const notesWithStorageKey = await prisma.note.findMany({
        where: { storageKey: { not: null } },
        select: { id: true, title: true, storageKey: true }
      });

      let missingFilesCount = 0;
      for (const n of notesWithStorageKey) {
        const p = path.join(uploadDir, path.basename(n.storageKey));
        if (!fs.existsSync(p)) {
          missingFilesCount++;
        }
      }
      recordCheck('Physical File Storage', missingFilesCount === 0, missingFilesCount === 0 ? `All ${notesWithStorageKey.length} file-backed notes reference real files on disk` : `${missingFilesCount} notes reference missing files on disk`);
    }

    // 7. Navigation Label Integrity
    const navConfigs = await prisma.navigationConfiguration.findMany();
    let hasLegacyLabel = false;
    for (const nc of navConfigs) {
      const str = JSON.stringify(nc);
      if (str.includes('Academic Architecture (KRMU)') || str.includes('Academic Architecture (krmu)') || str.includes('Academic Architecture — KRMU')) {
        hasLegacyLabel = true;
      }
    }
    recordCheck('Navigation Configuration', !hasLegacyLabel, !hasLegacyLabel ? 'Navigation items strictly labeled "Academic Architecture"' : 'Found legacy KRMU suffix in navigation');

    // 8. Relational Integrity Checks
    const allBookmarks = await prisma.bookmark.findMany({
      select: { id: true, user: { select: { id: true } }, note: { select: { id: true } } }
    });
    const orphanedBookmarks = allBookmarks.filter((b) => !b.user || !b.note).length;
    recordCheck('Bookmark Integrity', orphanedBookmarks === 0, `${orphanedBookmarks} orphaned bookmarks`);

    const allItems = await prisma.studyCollectionItem.findMany({
      select: { id: true, collection: { select: { id: true } }, note: { select: { id: true } } }
    });
    const orphanedCollectionItems = allItems.filter((i) => !i.collection || !i.note).length;
    recordCheck('Collection Item Integrity', orphanedCollectionItems === 0, `${orphanedCollectionItems} orphaned collection items`);

    // 9. Accounts & Governance
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    recordCheck('Super Admin Account', !!superAdmin && superAdmin.isActive, superAdmin ? `Active Super Admin (${superAdmin.email})` : 'Missing Super Admin');

  } catch (err) {
    allPassed = false;
    recordCheck('Verification Execution', false, `Verifier exception: ${err.message}`);
  }

  return {
    isValid: allPassed,
    checks: results
  };
}
