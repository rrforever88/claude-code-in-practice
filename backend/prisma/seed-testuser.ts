import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number, hour = 20, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const EMAIL = 'alex@welltrack.dev';
  const PASSWORD = 'WellTrack42!';

  await prisma.user.deleteMany({ where: { email: EMAIL } });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: EMAIL, passwordHash, displayName: 'Alex' },
  });
  console.log(`Created user: ${EMAIL} / ${PASSWORD}`);

  // --- Symptoms (system defaults) ---
  const symptoms = await prisma.symptom.findMany({ where: { userId: null } });
  const byName = (name: string) => symptoms.find((s) => s.name === name)!;
  const headache  = byName('Headache');
  const fatigue   = byName('Fatigue');
  const jointPain = byName('Joint Pain');
  const anxiety   = byName('Anxiety');
  const insomnia  = byName('Insomnia');

  // --- Medications ---
  const ibuprofen = await prisma.medication.create({
    data: { userId: user.id, name: 'Ibuprofen', dosage: '400 mg', frequency: 'As needed' },
  });
  const vitaminD = await prisma.medication.create({
    data: { userId: user.id, name: 'Vitamin D', dosage: '2000 IU', frequency: 'Daily' },
  });

  // --- Habits (system defaults) ---
  const habits = await prisma.habit.findMany({ where: { userId: null } });
  const sleep    = habits.find((h) => h.name === 'Sleep Duration')!;
  const water    = habits.find((h) => h.name === 'Water Intake')!;
  const exercise = habits.find((h) => h.name === 'Exercise')!;
  const caffeine = habits.find((h) => h.name === 'Caffeine')!;

  // --- Seed 30 days ---
  for (let day = 29; day >= 0; day--) {
    // Mood — daily, scores drift in a weekly pattern (worse mid-week)
    const weekday = new Date().getDay(); // 0=Sun
    const dayOfWeek = (new Date().getDay() - day + 7) % 7;
    const midWeekDip = (dayOfWeek >= 2 && dayOfWeek <= 4) ? -1 : 0;
    const moodScore  = Math.max(1, Math.min(5, rand(3, 5) + midWeekDip));
    const energy     = Math.max(1, Math.min(5, moodScore + rand(-1, 1)));
    const stress     = Math.max(1, Math.min(5, 6 - moodScore + rand(-1, 1)));
    await prisma.moodLog.create({
      data: { userId: user.id, moodScore, energyLevel: energy, stressLevel: stress, loggedAt: daysAgo(day, 21) },
    });

    // Headache — 60 % of days, worse severity when mood is low
    if (Math.random() < 0.6) {
      await prisma.symptomLog.create({
        data: { userId: user.id, symptomId: headache.id, severity: moodScore <= 2 ? rand(6, 9) : rand(3, 6), loggedAt: daysAgo(day, 14) },
      });
    }

    // Fatigue — 70 % of days
    if (Math.random() < 0.7) {
      await prisma.symptomLog.create({
        data: { userId: user.id, symptomId: fatigue.id, severity: rand(3, 7), loggedAt: daysAgo(day, 10) },
      });
    }

    // Joint pain — 30 % of days
    if (Math.random() < 0.3) {
      await prisma.symptomLog.create({
        data: { userId: user.id, symptomId: jointPain.id, severity: rand(2, 6), loggedAt: daysAgo(day, 16) },
      });
    }

    // Anxiety — 25 % of days (spikes mid-week)
    if (Math.random() < (dayOfWeek >= 2 && dayOfWeek <= 4 ? 0.5 : 0.2)) {
      await prisma.symptomLog.create({
        data: { userId: user.id, symptomId: anxiety.id, severity: rand(3, 7), loggedAt: daysAgo(day, 18) },
      });
    }

    // Insomnia — 20 % of days
    if (Math.random() < 0.2) {
      await prisma.symptomLog.create({
        data: { userId: user.id, symptomId: insomnia.id, severity: rand(4, 8), loggedAt: daysAgo(day, 22) },
      });
    }

    // Ibuprofen — taken ~40 % of days (bad days)
    const tookIbu = moodScore <= 3 && Math.random() < 0.6;
    await prisma.medicationLog.create({
      data: { userId: user.id, medicationId: ibuprofen.id, taken: tookIbu, createdAt: daysAgo(day, 12) },
    });

    // Vitamin D — taken most days (85 %)
    const tookVitD = Math.random() < 0.85;
    await prisma.medicationLog.create({
      data: { userId: user.id, medicationId: vitaminD.id, taken: tookVitD, createdAt: daysAgo(day, 8) },
    });

    // Sleep — every day, 5–9 hours (in minutes)
    const sleepHrs = rand(5, 9);
    await prisma.habitLog.create({
      data: { userId: user.id, habitId: sleep.id, valueDuration: sleepHrs * 60, loggedAt: daysAgo(day, 7) },
    });

    // Water — every day, 4–10 glasses
    await prisma.habitLog.create({
      data: { userId: user.id, habitId: water.id, valueNumeric: rand(4, 10), loggedAt: daysAgo(day, 20) },
    });

    // Exercise — ~4 days/week
    await prisma.habitLog.create({
      data: { userId: user.id, habitId: exercise.id, valueBoolean: Math.random() < 0.55, loggedAt: daysAgo(day, 17) },
    });

    // Caffeine — 1–3 cups most days
    await prisma.habitLog.create({
      data: { userId: user.id, habitId: caffeine.id, valueNumeric: rand(1, 3), loggedAt: daysAgo(day, 9) },
    });
  }

  const counts = await Promise.all([
    prisma.moodLog.count({ where: { userId: user.id } }),
    prisma.symptomLog.count({ where: { userId: user.id } }),
    prisma.medicationLog.count({ where: { userId: user.id } }),
    prisma.habitLog.count({ where: { userId: user.id } }),
  ]);
  console.log(`Seeded: ${counts[0]} mood, ${counts[1]} symptom, ${counts[2]} medication, ${counts[3]} habit logs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
