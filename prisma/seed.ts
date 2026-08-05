import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@interntrack.ai' },
    update: {},
    create: {
      email: 'demo@interntrack.ai',
      passwordHash,
      name: 'Demo Student',
      college: 'University of Technology',
      graduationYear: 2025
    }
  });

  const c1 = await prisma.company.create({
    data: {
      userId: user.id,
      companyName: 'Google',
      industry: 'Technology',
      location: 'Mountain View, CA',
      companyWebsite: 'https://google.com'
    }
  });

  const c2 = await prisma.company.create({
    data: {
      userId: user.id,
      companyName: 'Stripe',
      industry: 'Fintech',
      location: 'San Francisco, CA',
      companyWebsite: 'https://stripe.com'
    }
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      companyId: c1.id,
      role: 'Frontend Engineering Intern',
      status: 'Interview Scheduled',
      priority: 'High',
      deadlineDate: new Date(Date.now() + 86400000 * 2) // 2 days from now
    }
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      companyId: c2.id,
      role: 'Backend Engineering Intern',
      status: 'Applied',
      priority: 'Medium',
      deadlineDate: new Date(Date.now() + 86400000 * 5)
    }
  });

  console.log('Seed completed. Login with demo@interntrack.ai / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
