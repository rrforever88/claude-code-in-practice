import prisma from '../lib/prisma';
import { StatsResponse, FrequentSymptom } from '../types/stats';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function calculateStreak(userId: string): Promise<number> {
  const [symptomDates, moodDates, medicationDates, habitDates] = await Promise.all([
    prisma.symptomLog.findMany({ where: { userId }, select: { loggedAt: true } }),
    prisma.moodLog.findMany({ where: { userId }, select: { loggedAt: true } }),
    prisma.medicationLog.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.habitLog.findMany({ where: { userId }, select: { loggedAt: true } }),
  ]);

  const dateSet = new Set<string>();
  symptomDates.forEach((r) => dateSet.add(toDateStr(r.loggedAt)));
  moodDates.forEach((r) => dateSet.add(toDateStr(r.loggedAt)));
  medicationDates.forEach((r) => dateSet.add(toDateStr(r.createdAt)));
  habitDates.forEach((r) => dateSet.add(toDateStr(r.loggedAt)));

  if (dateSet.size === 0) return 0;

  const sortedDates = Array.from(dateSet).sort().reverse();
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));

  // Streak must include today or yesterday to be active
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00Z');
    const curr = new Date(sortedDates[i] + 'T00:00:00Z');
    const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getUserStats(userId: string): Promise<StatsResponse> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [moodAgg, symptomGroups, symptomCount, moodCount, medicationCount, habitCount, streak] =
    await Promise.all([
      prisma.moodLog.aggregate({
        where: { userId, loggedAt: { gte: thirtyDaysAgo } },
        _avg: { moodScore: true },
      }),
      prisma.symptomLog.groupBy({
        by: ['symptomId'],
        where: { userId },
        _count: { symptomId: true },
        orderBy: { _count: { symptomId: 'desc' } },
        take: 5,
      }),
      prisma.symptomLog.count({ where: { userId } }),
      prisma.moodLog.count({ where: { userId } }),
      prisma.medicationLog.count({ where: { userId } }),
      prisma.habitLog.count({ where: { userId } }),
      calculateStreak(userId),
    ]);

  const symptomIds = symptomGroups.map((g) => g.symptomId);
  const symptoms = await prisma.symptom.findMany({
    where: { id: { in: symptomIds } },
    select: { id: true, name: true },
  });
  const symptomMap = new Map(symptoms.map((s) => [s.id, s.name]));

  const topSymptoms: FrequentSymptom[] = symptomGroups.map((g) => ({
    symptomId: g.symptomId,
    name: symptomMap.get(g.symptomId) ?? 'Unknown',
    count: g._count.symptomId,
  }));

  return {
    avgMoodScoreLast30Days: moodAgg._avg.moodScore,
    topSymptoms,
    currentStreak: streak,
    totalLogsByType: {
      symptomLogs: symptomCount,
      moodLogs: moodCount,
      medicationLogs: medicationCount,
      habitLogs: habitCount,
    },
  };
}
