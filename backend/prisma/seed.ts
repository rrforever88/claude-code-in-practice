import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TrackingType } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingSymptoms = await prisma.symptom.count({ where: { userId: null } });

  if (existingSymptoms === 0) {
    await prisma.symptom.createMany({
      data: [
        { name: 'Headache', category: 'neurological' },
        { name: 'Fatigue', category: 'general' },
        { name: 'Joint Pain', category: 'pain' },
        { name: 'Muscle Pain', category: 'pain' },
        { name: 'Nausea', category: 'digestive' },
        { name: 'Brain Fog', category: 'neurological' },
        { name: 'Dizziness', category: 'neurological' },
        { name: 'Insomnia', category: 'sleep' },
        { name: 'Anxiety', category: 'mental' },
        { name: 'Stomach Pain', category: 'digestive' },
        { name: 'Back Pain', category: 'pain' },
      ],
    });
    console.log('Seeded 11 default symptoms.');
  } else {
    console.log('Default symptoms already exist, skipping.');
  }

  const existingHabits = await prisma.habit.count({ where: { userId: null } });

  if (existingHabits === 0) {
    await prisma.habit.createMany({
      data: [
        { name: 'Sleep Duration', trackingType: TrackingType.DURATION, unit: 'hours' },
        { name: 'Water Intake', trackingType: TrackingType.NUMERIC, unit: 'glasses' },
        { name: 'Exercise', trackingType: TrackingType.BOOLEAN },
        { name: 'Alcohol', trackingType: TrackingType.BOOLEAN },
        { name: 'Caffeine', trackingType: TrackingType.NUMERIC, unit: 'cups' },
      ],
    });
    console.log('Seeded 5 default habits.');
  } else {
    console.log('Default habits already exist, skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
