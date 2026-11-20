import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TrackingType } from '@prisma/client';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

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

  // Demo user with 30 days of mood and symptom logs
  const demoEmail = 'demo@welltrack.dev';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('demo1234', 10);
    demoUser = await prisma.user.create({
      data: { email: demoEmail, passwordHash, displayName: 'Demo User' },
    });
    console.log('Created demo user.');
  } else {
    console.log('Demo user already exists, skipping user creation.');
  }

  const existingMoodLogs = await prisma.moodLog.count({ where: { userId: demoUser.id } });

  if (existingMoodLogs === 0) {
    // 30 days of mood logs with varied scores
    await prisma.moodLog.createMany({
      data: Array.from({ length: 30 }, (_, i) => ({
        userId: demoUser!.id,
        moodScore: 2 + (i % 4), // cycles 2–5
        energyLevel: 1 + (i % 5),
        stressLevel: 1 + ((i + 2) % 5),
        loggedAt: daysAgo(29 - i),
      })),
    });
    console.log('Seeded 30 mood logs for demo user.');
  } else {
    console.log('Demo mood logs already exist, skipping.');
  }

  // Fetch the system default symptoms for the demo logs
  const defaultSymptoms = await prisma.symptom.findMany({
    where: { userId: null },
    select: { id: true, name: true },
  });

  if (defaultSymptoms.length > 0) {
    const existingSymptomLogs = await prisma.symptomLog.count({ where: { userId: demoUser.id } });

    if (existingSymptomLogs === 0) {
      // Spread symptom logs across 30 days; Headache and Fatigue appear most
      const headache = defaultSymptoms.find((s) => s.name === 'Headache')!;
      const fatigue = defaultSymptoms.find((s) => s.name === 'Fatigue')!;
      const jointPain = defaultSymptoms.find((s) => s.name === 'Joint Pain')!;

      const logs = [];
      for (let i = 0; i < 30; i++) {
        logs.push({ userId: demoUser.id, symptomId: headache.id, severity: 4 + (i % 5), loggedAt: daysAgo(29 - i) });
        if (i % 2 === 0) {
          logs.push({ userId: demoUser.id, symptomId: fatigue.id, severity: 3 + (i % 4), loggedAt: daysAgo(29 - i) });
        }
        if (i % 5 === 0) {
          logs.push({ userId: demoUser.id, symptomId: jointPain.id, severity: 2 + (i % 6), loggedAt: daysAgo(29 - i) });
        }
      }

      await prisma.symptomLog.createMany({ data: logs });
      console.log(`Seeded ${logs.length} symptom logs for demo user.`);
    } else {
      console.log('Demo symptom logs already exist, skipping.');
    }
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
