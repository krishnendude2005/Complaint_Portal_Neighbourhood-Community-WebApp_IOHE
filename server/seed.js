import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let society = await prisma.society.findFirst();
  if (!society) {
    society = await prisma.society.create({
      data: { name: 'Sunrise Apartments', address: '123 Main Street' }
    });
  }

  const hashed = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'Admin User',
      role: 'admin',
      societyId: society.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'resident@example.com' },
    update: {},
    create: {
      email: 'resident@example.com',
      password: hashed,
      name: 'John Resident',
      role: 'resident',
      flatNumber: '302',
      societyId: society.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password: hashed,
      name: 'Ramesh Kumar',
      role: 'staff',
      societyId: society.id
    }
  });

  console.log('Seed completed. Demo accounts (password: password123):');
  console.log('  admin@example.com, resident@example.com, staff@example.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
