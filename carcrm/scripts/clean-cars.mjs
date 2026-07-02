import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${cars.length} cars`);
  
  // Keep the first 5 unique cars based on make+model
  const kept = new Set();
  const toDelete = [];

  for (const car of cars) {
    const key = `${car.make} ${car.model}`;
    if (!kept.has(key) && kept.size < 5) {
      kept.add(key);
      console.log(`Keeping: ${key} (${car.id})`);
    } else {
      toDelete.push(car.id);
      console.log(`Deleting: ${key} (${car.id})`);
    }
  }

  for (const id of toDelete) {
    await prisma.car.delete({ where: { id } });
  }

  console.log('Cleanup complete');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
