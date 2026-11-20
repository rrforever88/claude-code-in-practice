import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getSymptoms, createSymptomLog } from '../api/symptoms'
import type { Symptom } from '../types'

const schema = z.object({
  symptomId: z.string().min(1, 'Please select a symptom'),
  severity: z.number().int().min(1).max(10),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function LogSymptomModal({ onClose, onSaved }: Props) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])

  useEffect(() => {
    getSymptoms().then(setSymptoms).catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      severity: 5,
      loggedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const severity = watch('severity')

  const onSubmit = async (data: FormData) => {
    await createSymptomLog({
      symptomId: data.symptomId,
      severity: data.severity,
      notes: data.notes || undefined,
      loggedAt: data.loggedAt ? new Date(data.loggedAt).toISOString() : undefined,
    })
    onSaved()
  }

  return (
    <ModalShell title="Log Symptom" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Symptom</label>
          <select {...register('symptomId')} className={inputCls(!!errors.symptomId)}>
            <option value="">Select…</option>
            {symptoms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.symptomId && <Err msg={errors.symptomId.message} />}
        </div>

        <div>
          <label className={labelCls}>Severity: {severity}/10</label>
          <input
            type="range"
            min={1}
            max={10}
            {...register('severity', { valueAsNumber: true })}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Mild</span>
            <span>Severe</span>
          </div>
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

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalActions({
  onClose,
  isSubmitting,
}: {
  onClose: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
export const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`
export const Err = ({ msg }: { msg?: string }) => (
  <p className="mt-1 text-xs text-red-600">{msg}</p>
)
