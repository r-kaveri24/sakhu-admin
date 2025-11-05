import { PrismaClient } from '@/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sakhu.org' },
    update: {},
    create: {
      email: 'admin@sakhu.org',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create editor user
  const editorPassword = await hash('editor123', 10);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@sakhu.org' },
    update: {},
    create: {
      email: 'editor@sakhu.org',
      name: 'Editor User',
      password: editorPassword,
      role: 'EDITOR',
    },
  });

  console.log('✅ Editor user created:', editor.email);

  console.log('\n📋 Login Credentials:');
  console.log('┌─────────────────────────────────────┐');
  console.log('│ ADMIN ACCOUNT                       │');
  console.log('│ Email: admin@sakhu.org              │');
  console.log('│ Password: admin123                  │');
  console.log('├─────────────────────────────────────┤');
  console.log('│ EDITOR ACCOUNT                      │');
  console.log('│ Email: editor@sakhu.org             │');
  console.log('│ Password: editor123                 │');
  console.log('└─────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
