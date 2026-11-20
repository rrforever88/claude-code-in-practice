import { useCallback, useEffect, useState } from 'react'
import { getSymptomLogs } from '../api/symptoms'
import { getMoodLogs } from '../api/mood'
import { getMedicationLogs } from '../api/medications'
import { getHabitLogs } from '../api/habits'
import type { SymptomLog, MoodLog, MedicationLog, HabitLog } from '../types'
import LogSymptomModal from '../components/LogSymptomModal'
import LogMoodModal from '../components/LogMoodModal'
import LogMedicationModal from '../components/LogMedicationModal'
import LogHabitModal from '../components/LogHabitModal'
import AppLayout from '../components/AppLayout'

type ModalType = 'symptom' | 'mood' | 'medication' | 'habit' | null

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

function weekRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

/** Returns how many distinct calendar days appear in the log array. */
function countDays(logs: { loggedAt: string }[]) {
  const days = new Set(logs.map((l) => l.loggedAt.slice(0, 10)))
  return days.size
}

export default function DashboardPage() {
  const [modal, setModal] = useState<ModalType>(null)
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([])
  const [weekLogs, setWeekLogs] = useState<{ loggedAt: string }[]>([])

  const today = todayRange()
  const week = weekRange()

  const refresh = useCallback(async () => {
    const [sl, ml, medl, hl, weekAll] = await Promise.all([
      getSymptomLogs(today).catch(() => [] as SymptomLog[]),
      getMoodLogs(today).catch(() => [] as MoodLog[]),
      getMedicationLogs(today).catch(() => [] as MedicationLog[]),
      getHabitLogs(today).catch(() => [] as HabitLog[]),
      Promise.all([
        getSymptomLogs(week).catch(() => [] as SymptomLog[]),
        getMoodLogs(week).catch(() => [] as MoodLog[]),
        getMedicationLogs(week).catch(() => [] as MedicationLog[]),
        getHabitLogs(week).catch(() => [] as HabitLog[]),
      ]).then((all) => all.flat()),
    ])
    setSymptomLogs(sl)
    setMoodLogs(ml)
    setMedicationLogs(medl)
    setHabitLogs(hl)
    setWeekLogs(weekAll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const daysThisWeek = countDays(weekLogs)

  const closeAndRefresh = () => {
    setModal(null)
    refresh()
  }

  const dateHeader = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="text-sm text-gray-500">{dateHeader}</p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-0.5">Today's log</h1>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-sm px-3 py-1 rounded-full">
          <span className="font-semibold">{daysThisWeek}</span>
          <span>/ 7 days logged this week</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard
          title="Symptoms"
          count={symptomLogs.length}
          emptyText="No symptoms logged today"
          onAdd={() => setModal('symptom')}
          color="orange"
        >
          {symptomLogs.slice(0, 3).map((log) => (
            <LogRow key={log.id} label={log.symptom?.name ?? '—'} detail={`Severity ${log.severity}`} />
          ))}
          {symptomLogs.length > 3 && (
            <p className="text-xs text-gray-400">+{symptomLogs.length - 3} more</p>
          )}
        </SectionCard>

        <SectionCard
          title="Mood"
          count={moodLogs.length}
          emptyText="No mood logged today"
          onAdd={() => setModal('mood')}
          color="violet"
        >
          {moodLogs.slice(0, 3).map((log) => (
            <LogRow key={log.id} label={`Score: ${log.moodScore}/5`} detail={log.energyLevel ? `Energy ${log.energyLevel}` : ''} />
          ))}
        </SectionCard>

        <SectionCard
          title="Medications"
          count={medicationLogs.length}
          emptyText="No medications logged today"
          onAdd={() => setModal('medication')}
          color="blue"
        >
          {medicationLogs.slice(0, 3).map((log) => (
            <LogRow key={log.id} label={log.medication?.name ?? '—'} detail={log.taken ? 'Taken' : 'Skipped'} />
          ))}
          {medicationLogs.length > 3 && (
            <p className="text-xs text-gray-400">+{medicationLogs.length - 3} more</p>
          )}
        </SectionCard>

        <SectionCard
          title="Habits"
          count={habitLogs.length}
          emptyText="No habits logged today"
          onAdd={() => setModal('habit')}
          color="green"
        >
          {habitLogs.slice(0, 3).map((log) => (
            <LogRow key={log.id} label={log.habit?.name ?? '—'} detail={habitValue(log)} />
          ))}
          {habitLogs.length > 3 && (
            <p className="text-xs text-gray-400">+{habitLogs.length - 3} more</p>
          )}
        </SectionCard>
      </div>

      {modal === 'symptom' && <LogSymptomModal onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
      {modal === 'mood' && <LogMoodModal onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
      {modal === 'medication' && <LogMedicationModal onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
      {modal === 'habit' && <LogHabitModal onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
    </AppLayout>
  )
}

function habitValue(log: HabitLog): string {
  if (log.valueBoolean !== null) return log.valueBoolean ? '✓ Done' : '✗ Skipped'
  if (log.valueNumeric !== null) return String(log.valueNumeric)
  if (log.valueDuration !== null) return `${log.valueDuration} min`
  return ''
}

const colorMap = {
  orange: 'bg-orange-50 border-orange-200',
  violet: 'bg-violet-50 border-violet-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
}
const badgeMap = {
  orange: 'bg-orange-100 text-orange-700',
  violet: 'bg-violet-100 text-violet-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
}
const btnMap = {
  orange: 'text-orange-600 hover:text-orange-700',
  violet: 'text-violet-600 hover:text-violet-700',
  blue: 'text-blue-600 hover:text-blue-700',
  green: 'text-green-600 hover:text-green-700',
}

function SectionCard({
  title,
  count,
  emptyText,
  onAdd,
  color,
  children,
}: {
  title: string
  count: number
  emptyText: string
  onAdd: () => void
  color: 'orange' | 'violet' | 'blue' | 'green'
  children?: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {count > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeMap[color]}`}>
              {count}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className={`text-sm font-medium transition-colors ${btnMap[color]}`}
        >
          + Add
        </button>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  )
}

function LogRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-800 truncate">{label}</span>
      {detail && <span className="text-gray-500 text-xs ml-2 shrink-0">{detail}</span>}
    </div>
  )
}
