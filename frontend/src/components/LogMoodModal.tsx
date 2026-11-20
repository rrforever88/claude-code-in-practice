import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createMoodLog } from '../api/mood'
import { ModalShell, ModalActions, labelCls, inputCls } from './LogSymptomModal'

const schema = z.object({
  moodScore: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  stressLevel: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const MOOD_LABELS = ['', '😞 Very low', '😕 Low', '😐 Neutral', '🙂 Good', '😊 Great']

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function LogMoodModal({ onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      moodScore: 3,
      energyLevel: 3,
      stressLevel: 3,
      loggedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const moodScore = watch('moodScore')
  const energyLevel = watch('energyLevel')
  const stressLevel = watch('stressLevel')

  const onSubmit = async (data: FormData) => {
    await createMoodLog({
      moodScore: data.moodScore,
      energyLevel: data.energyLevel,
      stressLevel: data.stressLevel,
      notes: data.notes || undefined,
      loggedAt: data.loggedAt ? new Date(data.loggedAt).toISOString() : undefined,
    })
    onSaved()
  }

  return (
    <ModalShell title="Log Mood" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Mood</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue('moodScore', v)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  moodScore === v
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-teal-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">{MOOD_LABELS[moodScore] ?? ''}</p>
          <input type="hidden" {...register('moodScore', { valueAsNumber: true })} />
        </div>

        <div>
          <label className={labelCls}>Energy level: {energyLevel}/5</label>
          <input
            type="range"
            min={1}
            max={5}
            {...register('energyLevel', { valueAsNumber: true })}
            className="w-full accent-teal-600"
          />
        </div>

        <div>
          <label className={labelCls}>Stress level: {stressLevel}/5</label>
          <input
            type="range"
            min={1}
            max={5}
            {...register('stressLevel', { valueAsNumber: true })}
            className="w-full accent-teal-600"
          />
        </div>

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
