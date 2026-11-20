import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getHabits, createHabitLog } from '../api/habits'
import type { Habit } from '../types'
import { ModalShell, ModalActions, labelCls, inputCls } from './LogSymptomModal'

const schema = z.object({
  habitId: z.string().min(1, 'Please select a habit'),
  valueBoolean: z.boolean().optional(),
  valueNumeric: z.number().optional(),
  valueDuration: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function LogHabitModal({ onClose, onSaved }: Props) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  useEffect(() => {
    getHabits().then(setHabits).catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      valueBoolean: true,
      loggedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const habitId = watch('habitId')
  const valueBoolean = watch('valueBoolean')

  useEffect(() => {
    const h = habits.find((h) => h.id === habitId) ?? null
    setSelectedHabit(h)
  }, [habitId, habits])

  const onSubmit = async (data: FormData) => {
    await createHabitLog({
      habitId: data.habitId,
      valueBoolean: selectedHabit?.trackingType === 'BOOLEAN' ? data.valueBoolean : undefined,
      valueNumeric: selectedHabit?.trackingType === 'NUMERIC' ? data.valueNumeric : undefined,
      valueDuration: selectedHabit?.trackingType === 'DURATION' ? data.valueDuration : undefined,
      notes: data.notes || undefined,
      loggedAt: data.loggedAt ? new Date(data.loggedAt).toISOString() : undefined,
    })
    onSaved()
  }

  return (
    <ModalShell title="Log Habit" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Habit</label>
          <select {...register('habitId')} className={inputCls(!!errors.habitId)}>
            <option value="">Select…</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          {errors.habitId && <p className="mt-1 text-xs text-red-600">{errors.habitId.message}</p>}
        </div>

        {selectedHabit?.trackingType === 'BOOLEAN' && (
          <div>
            <label className={labelCls}>Completed?</label>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setValue('valueBoolean', v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    valueBoolean === v
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-teal-400'
                  }`}
                >
                  {v ? '✓ Yes' : '✗ No'}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('valueBoolean')} />
          </div>
        )}

        {selectedHabit?.trackingType === 'NUMERIC' && (
          <div>
            <label className={labelCls}>
              Value{selectedHabit.unit ? ` (${selectedHabit.unit})` : ''}
            </label>
            <input
              type="number"
              step="any"
              {...register('valueNumeric', { valueAsNumber: true })}
              className={inputCls(false)}
            />
          </div>
        )}

        {selectedHabit?.trackingType === 'DURATION' && (
          <div>
            <label className={labelCls}>Duration (minutes)</label>
            <input
              type="number"
              min={0}
              {...register('valueDuration', { valueAsNumber: true })}
              className={inputCls(false)}
            />
          </div>
        )}

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <textarea {...register('notes')} rows={2} className={inputCls(false)} />
        </div>

        <div>
          <label className={labelCls}>Date &amp; time</label>
          <input type="datetime-local" {...register('loggedAt')} className={inputCls(false)} />
        </div>

        <ModalActions onClose={onClose} isSubmitting={isSubmitting} />
      </form>
    </ModalShell>
  )
}
