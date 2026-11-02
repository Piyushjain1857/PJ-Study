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

  // eslint-disable-next-line no-console
  console.log('✓ Seeding complete:');
  // eslint-disable-next-line no-console
  console.log(`  Super Admin: ${superadmin.email} (password: Password123!)`);
  // eslint-disable-next-line no-console
  console.log(`  Student:     ${student.email} (password: Password123!)`);
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
