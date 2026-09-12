const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    const itemCount = await prisma.archiveItem.count();
    console.log('✅ Prisma SQLite Database connected successfully!');
    console.log(`📊 SQLite Users: ${userCount}, Archive Items: ${itemCount}`);
  } catch (err) {
    console.error('❌ Prisma SQLite error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
