import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Seed Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@portal.com' },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@portal.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed Moderator
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@portal.com' },
    update: {
      passwordHash,
      role: 'MODERATOR',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Academic Moderator',
      email: 'moderator@portal.com',
      passwordHash,
      role: 'MODERATOR',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed standard student scholar
  const student = await prisma.user.upsert({
    where: { email: 'student@portal.com' },
    update: {
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      isActive: true
    },
    create: {
      name: 'Scholar Student',
      email: 'student@portal.com',
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      isActive: true
    }
  });

  // Seed Categories
  const categories = [
    {
      name: 'Lecture Notes',
      slug: 'lecture-notes',
      description: 'Comprehensive lecture transcripts and instructor slides.'
    },
    {
      name: 'Exam Prep & Solutions',
      slug: 'exam-prep',
      description: 'Past year papers, model solutions, and exam preparation kits.'
    },
    {
      name: 'Lab Manuals',
      slug: 'lab-manuals',
      description: 'Practical guides, experimental observations, and lab code.'
    },
    {
      name: 'Cheat Sheets & Summaries',
      slug: 'cheat-sheets',
      description: 'Quick reference formulas, key concepts, and exam revision sheets.'
    },
    {
      name: 'Assignments & Projects',
      slug: 'assignments',
      description: 'Academic problem sets, project documentation, and case studies.'
    }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
  }

  // Seed Course
  const course = await prisma.course.upsert({
    where: { slug: 'btech-computer-science' },
    update: { name: 'B.Tech Computer Science & Engineering' },
    create: {
      name: 'B.Tech Computer Science & Engineering',
      slug: 'btech-computer-science',
      description: 'Undergraduate core engineering curriculum.'
    }
  });

  // Seed Subjects
  const subjects = [
    {
      courseId: course.id,
      name: 'Data Structures & Algorithms',
      slug: 'data-structures-and-algorithms',
      semester: 3,
      description: 'Arrays, Trees, Graphs, Sorting, and Dynamic Programming.'
    },
    {
      courseId: course.id,
      name: 'Database Management Systems',
      slug: 'database-management-systems',
      semester: 4,
      description: 'Relational algebra, SQL, Normalization, and Transactions.'
    },
    {
      courseId: course.id,
      name: 'Operating Systems',
      slug: 'operating-systems',
      semester: 4,
      description: 'Concurrency, Memory Management, CPU Scheduling, and File Systems.'
    },
    {
      courseId: course.id,
      name: 'Computer Networks',
      slug: 'computer-networks',
      semester: 5,
      description: 'TCP/IP stack, routing protocols, and network security.'
    }
  ];

  for (const subj of subjects) {
    await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: course.id,
          slug: subj.slug
        }
      },
      update: {
        name: subj.name,
        semester: subj.semester,
        description: subj.description
      },
      create: subj
    });
  }

  // eslint-disable-next-line no-console
  console.log('✓ Seeding complete:');
  // eslint-disable-next-line no-console
  console.log(`  Super Admin: ${superadmin.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Moderator:   ${moderator.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Student:     ${student.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Categories:  ${categories.length} seeded`);
  // eslint-disable-next-line no-console
  console.log(`  Course:      ${course.name}`);
  // eslint-disable-next-line no-console
  console.log(`  Subjects:    ${subjects.length} seeded`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
