export interface FrequentSymptom {
  symptomId: string;
  name: string;
  count: number;
}

export interface TotalLogsByType {
  symptomLogs: number;
  moodLogs: number;
  medicationLogs: number;
  habitLogs: number;
}

export interface StatsResponse {
  avgMoodScoreLast30Days: number | null;
  topSymptoms: FrequentSymptom[];
  currentStreak: number;
  totalLogsByType: TotalLogsByType;
}
