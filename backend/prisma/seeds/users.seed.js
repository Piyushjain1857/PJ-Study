/**
 * PJ Study User Accounts & Role Seeding Module
 * Seeds Super Admin, Faculty Evaluators (Admins), and Student Scholars.
 * Maps legacy MODERATOR role to ADMIN with full backward compatibility.
 */

import bcrypt from 'bcryptjs';

export const CORE_STAFF_ACCOUNTS = [
  {
    name: 'Super Admin',
    email: 'superadmin@portal.com',
    role: 'SUPER_ADMIN',
    bio: 'Institutional System Super Administrator — Platform Governance & Academic Oversight.'
  },
  {
    name: 'Prof. Arvind Sharma',
    email: 'dean.academic@krmu.edu.in',
    role: 'SUPER_ADMIN',
    bio: 'Dean of Academic Governance, Professor of Computer Science & Engineering.'
  },
  {
    name: 'Academic Admin',
    email: 'moderator@portal.com',
    role: 'ADMIN',
    bio: 'Central Academic Content Moderator & Review Board Lead.'
  },
  {
    name: 'Platform Admin',
    email: 'admin@portal.com',
    role: 'ADMIN',
    bio: 'Platform Operations Administrator & System Integrity Lead.'
  }
];

export const FACULTY_ACCOUNTS = [
  {
    name: 'Prof. Neha Gupta',
    email: 'neha.gupta@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Head of Department, Computer Science & Engineering. Specialization in Software Systems.'
  },
  {
    name: 'Dr. Rajesh Verma',
    email: 'rajesh.verma@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Associate Professor, Artificial Intelligence & Machine Learning.'
  },
  {
    name: 'Prof. Meenakshi Sundaram',
    email: 'meenakshi.s@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Professor of Applied Mathematics, Chair of Department of Mathematics.'
  },
  {
    name: 'Dr. Vikram Mehra',
    email: 'vikram.mehra@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Senior Faculty in Electronics, Embedded Systems & Digital Circuit Design.'
  },
  {
    name: 'Dr. Sunita Deshmukh',
    email: 'sunita.deshmukh@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Program Director for BCA & MCA Applications, Cloud Architectures.'
  },
  {
    name: 'Prof. Kunal Bhatia',
    email: 'kunal.bhatia@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Associate Professor, Software Engineering & Agile Methodologies.'
  },
  {
    name: 'Dr. Ananya Sen',
    email: 'ananya.sen@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Associate Professor, School of Basic & Applied Sciences. Specialization in Quantum Mechanics.'
  },
  {
    name: 'Prof. Deepak Chawla',
    email: 'deepak.chawla@krmu.edu.in',
    role: 'ADMIN',
    bio: 'Faculty Lead, Distributed Computing, High-Performance Systems & CUDA Architecture.'
  }
];

export const DEMO_SCHOLAR = {
  name: 'Scholar Student',
  email: 'student@portal.com',
  courseSlug: 'b-tech',
  semester: 1,
  isActive: true
};

export const EXTENDED_STUDENTS_LIST = [
  // B.Tech Scholars (Semesters 1-8)
  { name: 'Aarav Sharma', email: 'aarav.sharma@krmu.edu.in', courseSlug: 'b-tech', semester: 1, isActive: true, daysBack: 29 },
  { name: 'Ananya Verma', email: 'ananya.verma@krmu.edu.in', courseSlug: 'b-tech', semester: 1, isActive: true, daysBack: 28 },
  { name: 'Rohan Patel', email: 'rohan.patel@krmu.edu.in', courseSlug: 'b-tech', semester: 1, isActive: true, daysBack: 27 },
  { name: 'Priya Iyer', email: 'priya.iyer@krmu.edu.in', courseSlug: 'b-tech', semester: 1, isActive: true, daysBack: 26 },
  { name: 'Aditya Singh', email: 'aditya.singh@krmu.edu.in', courseSlug: 'b-tech', semester: 2, isActive: true, daysBack: 25 },
  { name: 'Sneha Rao', email: 'sneha.rao@krmu.edu.in', courseSlug: 'b-tech', semester: 2, isActive: true, daysBack: 24 },
  { name: 'Vikram Joshi', email: 'vikram.joshi@krmu.edu.in', courseSlug: 'b-tech', semester: 3, isActive: true, daysBack: 23 },
  { name: 'Pooja Nair', email: 'pooja.nair@krmu.edu.in', courseSlug: 'b-tech', semester: 3, isActive: true, daysBack: 22 },
  { name: 'Rahul Mehta', email: 'rahul.mehta@krmu.edu.in', courseSlug: 'b-tech', semester: 4, isActive: true, daysBack: 21 },
  { name: 'Ishita Sen', email: 'ishita.sen@krmu.edu.in', courseSlug: 'b-tech', semester: 4, isActive: true, daysBack: 20 },
  { name: 'Kabir Kapoor', email: 'kabir.kapoor@krmu.edu.in', courseSlug: 'b-tech', semester: 5, isActive: true, daysBack: 19 },
  { name: 'Tanvi Shukla', email: 'tanvi.shukla@krmu.edu.in', courseSlug: 'b-tech', semester: 5, isActive: true, daysBack: 18 },
  { name: 'Arjun Nambiar', email: 'arjun.nambiar@krmu.edu.in', courseSlug: 'b-tech', semester: 6, isActive: true, daysBack: 17 },
  { name: 'Diya Banerjee', email: 'diya.banerjee@krmu.edu.in', courseSlug: 'b-tech', semester: 6, isActive: true, daysBack: 16 },
  { name: 'Manav Bhatia', email: 'manav.bhatia@krmu.edu.in', courseSlug: 'b-tech', semester: 7, isActive: true, daysBack: 15 },
  { name: 'Riya Deshmukh', email: 'riya.deshmukh@krmu.edu.in', courseSlug: 'b-tech', semester: 7, isActive: true, daysBack: 14 },
  { name: 'Karan Thakur', email: 'karan.thakur@krmu.edu.in', courseSlug: 'b-tech', semester: 8, isActive: true, daysBack: 13 },
  { name: 'Siddharth Malhotra', email: 'sid.malhotra@krmu.edu.in', courseSlug: 'b-tech', semester: 8, isActive: true, daysBack: 12 },

  // BCA Scholars (Semesters 1-6)
  { name: 'Ayush Gupta', email: 'ayush.gupta@krmu.edu.in', courseSlug: 'bca', semester: 1, isActive: true, daysBack: 28 },
  { name: 'Kritika Saxena', email: 'kritika.saxena@krmu.edu.in', courseSlug: 'bca', semester: 1, isActive: true, daysBack: 26 },
  { name: 'Harsh Vardhan', email: 'harsh.vardhan@krmu.edu.in', courseSlug: 'bca', semester: 1, isActive: true, daysBack: 24 },
  { name: 'Simran Kaur', email: 'simran.kaur@krmu.edu.in', courseSlug: 'bca', semester: 2, isActive: true, daysBack: 22 },
  { name: 'Varun Chopra', email: 'varun.chopra@krmu.edu.in', courseSlug: 'bca', semester: 2, isActive: true, daysBack: 20 },
  { name: 'Meera Kulkarni', email: 'meera.kulkarni@krmu.edu.in', courseSlug: 'bca', semester: 3, isActive: true, daysBack: 18 },
  { name: 'Nikhil Tiwari', email: 'nikhil.tiwari@krmu.edu.in', courseSlug: 'bca', semester: 4, isActive: true, daysBack: 16 },
  { name: 'Shreya Pandey', email: 'shreya.pandey@krmu.edu.in', courseSlug: 'bca', semester: 5, isActive: true, daysBack: 14 },
  { name: 'Yash Mittal', email: 'yash.mittal@krmu.edu.in', courseSlug: 'bca', semester: 6, isActive: true, daysBack: 11 },
  { name: 'Tarun Oberoi', email: 'tarun.oberoi@krmu.edu.in', courseSlug: 'bca', semester: 2, isActive: false, daysBack: 25 }, // Suspended Student 1

  // B.Sc. Scholars (Semesters 1-6)
  { name: 'Divya Choudhary', email: 'divya.choudhary@krmu.edu.in', courseSlug: 'b-sc', semester: 1, isActive: true, daysBack: 27 },
  { name: 'Pranav Joshi', email: 'pranav.joshi@krmu.edu.in', courseSlug: 'b-sc', semester: 1, isActive: true, daysBack: 25 },
  { name: 'Ananya Roy', email: 'ananya.roy@krmu.edu.in', courseSlug: 'b-sc', semester: 2, isActive: true, daysBack: 21 },
  { name: 'Kartik Menon', email: 'kartik.menon@krmu.edu.in', courseSlug: 'b-sc', semester: 3, isActive: true, daysBack: 17 },
  { name: 'Swati Mishra', email: 'swati.mishra@krmu.edu.in', courseSlug: 'b-sc', semester: 4, isActive: true, daysBack: 13 },
  { name: 'Gaurav Kumar', email: 'gaurav.kumar@krmu.edu.in', courseSlug: 'b-sc', semester: 3, isActive: false, daysBack: 22 }, // Suspended Student 2

  // MCA Scholars (Semesters 1-4)
  { name: 'Akash Singh', email: 'akash.singh@krmu.edu.in', courseSlug: 'mca', semester: 1, isActive: true, daysBack: 26 },
  { name: 'Bhavna Sharma', email: 'bhavna.sharma@krmu.edu.in', courseSlug: 'mca', semester: 1, isActive: true, daysBack: 23 },
  { name: 'Chirag Lodha', email: 'chirag.lodha@krmu.edu.in', courseSlug: 'mca', semester: 2, isActive: true, daysBack: 19 },
  { name: 'Deepika Reddy', email: 'deepika.reddy@krmu.edu.in', courseSlug: 'mca', semester: 3, isActive: true, daysBack: 15 },
  { name: 'Farhan Ali', email: 'farhan.ali@krmu.edu.in', courseSlug: 'mca', semester: 4, isActive: true, daysBack: 10 },
  { name: 'Geetika Sethi', email: 'geetika.sethi@krmu.edu.in', courseSlug: 'mca', semester: 2, isActive: true, daysBack: 7 },

  // M.Tech Scholars (Semesters 1-4)
  { name: 'Himanshu Pandit', email: 'himanshu.pandit@krmu.edu.in', courseSlug: 'm-tech', semester: 1, isActive: true, daysBack: 24 },
  { name: 'Indira Rao', email: 'indira.rao@krmu.edu.in', courseSlug: 'm-tech', semester: 2, isActive: true, daysBack: 18 },
  { name: 'Jayant Somani', email: 'jayant.somani@krmu.edu.in', courseSlug: 'm-tech', semester: 3, isActive: true, daysBack: 12 },
  { name: 'Khushboo Nanda', email: 'khushboo.nanda@krmu.edu.in', courseSlug: 'm-tech', semester: 4, isActive: true, daysBack: 6 }
];

export async function seedUsers(prisma, academicData, options = {}) {
  const { mode = 'full', dryRun = false } = options;
  const stats = {
    users: { created: 0, existing: 0 }
  };

  const defaultPassword = process.env.SEED_DEV_PASSWORD || 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);
  const universityId = academicData.krmu?.id || null;

  // 1. Map legacy MODERATOR role to ADMIN safely
  if (!dryRun) {
    await prisma.user.updateMany({
      where: { role: 'MODERATOR' },
      data: { role: 'ADMIN' }
    });
  }

  // 2. In core mode, establish exactly the 3 canonical role accounts and purge all others
  if (mode === 'core') {
    const canonicalAccounts = [
      {
        name: 'Super Admin',
        email: 'superadmin@portal.com',
        role: 'SUPER_ADMIN',
        bio: 'Institutional System Super Administrator — Platform Governance & Academic Oversight.'
      },
      {
        name: 'Platform Admin',
        email: 'admin@portal.com',
        role: 'ADMIN',
        bio: 'Central Academic Content Administrator & System Integrity Lead.'
      },
      {
        name: 'Scholar Student',
        email: 'student@portal.com',
        role: 'STUDENT',
        bio: 'University Scholar — Academic Notes & Course Research.'
      }
    ];

    if (!dryRun) {
      const allowedEmails = canonicalAccounts.map((a) => a.email);
      await prisma.user.deleteMany({
        where: {
          email: { notIn: allowedEmails }
        }
      });
    }

    const seededUsers = {};
    for (const acc of canonicalAccounts) {
      const existing = await prisma.user.findUnique({ where: { email: acc.email } });
      if (existing) {
        stats.users.existing++;
        if (!dryRun) {
          seededUsers[acc.email] = await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: acc.name,
              role: acc.role,
              bio: acc.bio,
              university: 'K.R. Mangalam University',
              universityId,
              isEmailVerified: true,
              isActive: true
            }
          });
        } else {
          seededUsers[acc.email] = existing;
        }
      } else {
        stats.users.created++;
        if (!dryRun) {
          seededUsers[acc.email] = await prisma.user.create({
            data: {
              name: acc.name,
              email: acc.email,
              passwordHash,
              role: acc.role,
              bio: acc.bio,
              university: 'K.R. Mangalam University',
              universityId,
              isEmailVerified: true,
              isActive: true
            }
          });
        } else {
          seededUsers[acc.email] = { id: `dry-${acc.email}`, ...acc };
        }
      }
    }

    return {
      stats,
      staff: seededUsers,
      students: [seededUsers['student@portal.com']],
      primarySuperAdmin: seededUsers['superadmin@portal.com'],
      primaryAdmin: seededUsers['admin@portal.com'],
      primaryScholar: seededUsers['student@portal.com']
    };
  }

  // 2. Select staff accounts based on mode (demo / full)
  const staffToSeed = mode === 'demo'
    ? CORE_STAFF_ACCOUNTS
    : [...CORE_STAFF_ACCOUNTS, ...FACULTY_ACCOUNTS];

  const seededStaff = {};
  for (const s of staffToSeed) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } });
    if (existing) {
      stats.users.existing++;
      if (!dryRun) {
        seededStaff[s.email] = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: s.name,
            role: s.role,
            bio: s.bio,
            university: 'K.R. Mangalam University',
            universityId,
            isEmailVerified: true,
            isActive: true
          }
        });
      } else {
        seededStaff[s.email] = existing;
      }
    } else {
      stats.users.created++;
      if (!dryRun) {
        seededStaff[s.email] = await prisma.user.create({
          data: {
            name: s.name,
            email: s.email,
            passwordHash,
            role: s.role,
            bio: s.bio,
            university: 'K.R. Mangalam University',
            universityId,
            isEmailVerified: true,
            isActive: true
          }
        });
      } else {
        seededStaff[s.email] = { id: `dry-${s.email}`, ...s };
      }
    }
  }

  // 3. Students / Scholars (Skipped in Core mode)
  const seededStudents = [];
  if (mode !== 'core') {
    const studentsToSeed = mode === 'demo'
      ? [DEMO_SCHOLAR]
      : [DEMO_SCHOLAR, ...EXTENDED_STUDENTS_LIST];

    for (const st of studentsToSeed) {
      const course = academicData.courses[st.courseSlug];
      const existing = await prisma.user.findUnique({ where: { email: st.email } });
      const createdAt = st.daysBack ? new Date(Date.now() - st.daysBack * 86400000) : new Date();

      if (existing) {
        stats.users.existing++;
        if (!dryRun) {
          const updated = await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: st.name,
              role: 'STUDENT',
              university: 'K.R. Mangalam University',
              universityId,
              courseId: course?.id || null,
              semester: st.semester,
              isEmailVerified: true,
              isActive: st.isActive
            }
          });
          seededStudents.push(updated);
        } else {
          seededStudents.push(existing);
        }
      } else {
        stats.users.created++;
        if (!dryRun) {
          const created = await prisma.user.create({
            data: {
              name: st.name,
              email: st.email,
              passwordHash,
              role: 'STUDENT',
              university: 'K.R. Mangalam University',
              universityId,
              courseId: course?.id || null,
              semester: st.semester,
              isEmailVerified: true,
              isActive: st.isActive,
              createdAt
            }
          });
          seededStudents.push(created);
        } else {
          seededStudents.push({ id: `dry-${st.email}`, ...st });
        }
      }
    }
  }

  return {
    stats,
    staff: seededStaff,
    students: seededStudents,
    primarySuperAdmin: seededStaff['superadmin@portal.com'],
    primaryAdmin: seededStaff['admin@portal.com'] || seededStaff['moderator@portal.com'],
    primaryScholar: seededStudents[0]
  };
}
