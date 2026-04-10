import { db } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');
  await db.seedDatabase();
  console.log('Done.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
