/**
 * PJ Study Academic Notes Seeding Module
 * Seeds realistic study notes and physical sample files in local storage.
 * Ensures every single curriculum subject in Full mode has published notes (0 empty subjects).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../src/config/env.js';

// Standard RFC-compliant valid PDF 1.4 document buffer fixture
const VALID_SAMPLE_PDF_CONTENT = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] >>\nendobj\n' +
  'xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n' +
  'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n199\n%%EOF\n'
);

export async function seedNotes(prisma, academicData, userData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    notes: { created: 0, existing: 0 }
  };

  if (mode === 'core') {
    return { stats, notes: [] };
  }

  const uploadDir = env.uploadDir || path.resolve(process.cwd(), 'uploads/notes');
  if (!dryRun) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  const uploader = userData.primaryAdmin || userData.primarySuperAdmin;
  const categoryKeys = Object.keys(academicData.categories);
  const seededNotesList = [];
  let noteIndex = 0;

  // Iterate over all courses and their subjects to guarantee 100% coverage
  const courseSlugsToSeed = mode === 'demo' ? ['b-tech', 'bca'] : Object.keys(academicData.courses);

  for (const courseSlug of courseSlugsToSeed) {
    const course = academicData.courses[courseSlug];
    const program = academicData.courses[courseSlug];
    if (!course) continue;

    // Find all subjects belonging to this course
    const subjectsForCourse = Object.entries(academicData.subjects)
      .filter(([k]) => k.startsWith(`${courseSlug}:`))
      .map(([, subj]) => subj);

    for (const subj of subjectsForCourse) {
      noteIndex++;
      const catKey = categoryKeys[noteIndex % categoryKeys.length];
      const category = academicData.categories[catKey];
      const noteSlug = `${subj.slug}-comprehensive-handbook`;
      const fileName = `${subj.slug}-handout.pdf`;
      const storageKey = `seed-${subj.slug}.pdf`;
      const filePath = path.join(uploadDir, storageKey);

      // Create physical sample file on disk
      let fileHash = null;
      let fileSize = BigInt(VALID_SAMPLE_PDF_CONTENT.length);

      if (!dryRun) {
        fs.writeFileSync(filePath, VALID_SAMPLE_PDF_CONTENT);
        fileHash = crypto.createHash('sha256').update(VALID_SAMPLE_PDF_CONTENT).digest('hex');
      }

      const noteDate = new Date(Date.now() - ((noteIndex * 3) % 28) * 86400000);
      const pageCount = 20 + ((noteIndex * 7) % 35);
      const downloadCount = 35 + ((noteIndex * 13) % 180);
      const viewCount = downloadCount * 3 + ((noteIndex * 29) % 250);

      const noteData = {
        title: `${subj.name}: Comprehensive Examination Handout & Syllabus Guide`,
        slug: noteSlug,
        description: `Complete university syllabus notes, theorem proofs, and review exercises for ${subj.name}. Accredited for ${subj.credits || 3} credits.`,
        content: `# ${subj.name}\n\n## Comprehensive Academic Curriculum & Examination Reference\n\n### 1. Conceptual Framework & Theoretical Principles\nThis manuscript covers foundational concepts, theoretical derivations, and algorithmic formulations established in the university syllabus for ${subj.name}.\n\n### 2. Core Topics & Key Formulas\n- **Unit 1**: Theoretical Foundations and Mathematical Formulations.\n- **Unit 2**: Analytical Methods, Real-World Implementations, and Case Studies.\n- **Unit 3**: Problem Sets, Model Examination Questions, and Laboratory Exercises.\n\n\`\`\`\nAccredited Curriculum: ${subj.credits || 3} Credits · Semester ${subj.semester} · ${course.name}\n\`\`\``,
        semester: subj.semester,
        academicYear: '2025-2026',
        pageCount,
        downloadCount,
        viewCount,
        fileName,
        storageKey,
        fileSize,
        mimeType: 'application/pdf',
        status: 'PUBLISHED',
        publishedAt: noteDate,
        createdAt: noteDate,
        courseId: course.id,
        subjectId: subj.id,
        categoryId: category.id,
        universityId: academicData.krmu.id,
        schoolId: course.schoolId,
        uploadedById: uploader.id
      };

      const existing = await prisma.note.findFirst({ where: { slug: noteSlug } });
      let noteRecord;
      if (existing) {
        stats.notes.existing++;
        if (!dryRun) {
          noteRecord = await prisma.note.update({
            where: { id: existing.id },
            data: noteData
          });
        } else {
          noteRecord = existing;
        }
      } else {
        stats.notes.created++;
        if (!dryRun) {
          noteRecord = await prisma.note.create({
            data: noteData
          });
        } else {
          noteRecord = { id: `dry-${noteSlug}`, ...noteData };
        }
      }
      seededNotesList.push(noteRecord);
    }
  }

  // In Full mode, seed 4 Pending Moderation notes and 3 Draft notes
  if (mode === 'full') {
    const pendingSpecs = [
      {
        title: 'Advanced Quantum Cryptography & QKD Protocols Review Draft',
        slug: 'quantum-cryptography-qkd-review-draft',
        courseSlug: 'm-tech',
        subjectSlug: 'mtech-crypto-blockchain',
        categorySlug: 'lecture-notes',
        semester: 2
      },
      {
        title: 'Compiler Construction: LALR(1) Parsing Table Synthesizer',
        slug: 'compiler-construction-lalr1-synthesizer',
        courseSlug: 'b-tech',
        subjectSlug: 'compiler-design',
        categorySlug: 'assignments',
        semester: 6
      },
      {
        title: 'Full-Stack GraphQL Microservices Design Architecture',
        slug: 'graphql-microservices-design-architecture',
        courseSlug: 'mca',
        subjectSlug: 'mca-cloud-native',
        categorySlug: 'lecture-notes',
        semester: 1
      },
      {
        title: 'Bioinformatics Sequence Alignment & Scoring Matrices',
        slug: 'bioinformatics-sequence-alignment-matrices',
        courseSlug: 'b-sc',
        subjectSlug: 'bsc-numerical-analysis',
        categorySlug: 'lab-manuals',
        semester: 6
      }
    ];

    for (const spec of pendingSpecs) {
      const course = academicData.courses[spec.courseSlug];
      const subj = academicData.subjects[`${spec.courseSlug}:${spec.subjectSlug}`];
      const category = academicData.categories[spec.categorySlug];
      if (!course || !subj || !category) continue;

      const existing = await prisma.note.findFirst({ where: { slug: spec.slug } });
      const payload = {
        title: spec.title,
        slug: spec.slug,
        description: `Pending faculty evaluation manuscript for ${subj.name}.`,
        content: `# ${spec.title}\n\n*Pending Faculty Peer Review and Academic Moderation Approval.*`,
        semester: spec.semester,
        academicYear: '2025-2026',
        pageCount: 30,
        downloadCount: 0,
        viewCount: 15,
        mimeType: 'application/pdf',
        status: 'PENDING',
        publishedAt: null,
        createdAt: new Date(Date.now() - 3 * 86400000),
        courseId: course.id,
        subjectId: subj.id,
        categoryId: category.id,
        universityId: academicData.krmu.id,
        schoolId: course.schoolId,
        uploadedById: uploader.id
      };

      if (existing) {
        stats.notes.existing++;
        if (!dryRun) {
          const u = await prisma.note.update({ where: { id: existing.id }, data: payload });
          seededNotesList.push(u);
        }
      } else {
        stats.notes.created++;
        if (!dryRun) {
          const c = await prisma.note.create({ data: payload });
          seededNotesList.push(c);
        }
      }
    }
  }

  return {
    stats,
    notes: seededNotesList,
    publishedNotes: seededNotesList.filter((n) => n.status === 'PUBLISHED')
  };
}
