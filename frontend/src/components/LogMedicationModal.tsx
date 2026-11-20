import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getMedications, createMedicationLog } from '../api/medications'
import type { Medication } from '../types'
import { ModalShell, ModalActions, labelCls, inputCls } from './LogSymptomModal'

const schema = z.object({
  medicationId: z.string().min(1, 'Please select a medication'),
  taken: z.boolean(),
  takenAt: z.string().optional(),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function LogMedicationModal({ onClose, onSaved }: Props) {
  const [medications, setMedications] = useState<Medication[]>([])

  useEffect(() => {
    getMedications().then(setMedications).catch(() => {})
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
      taken: true,
      loggedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const taken = watch('taken')

  const onSubmit = async (data: FormData) => {
    await createMedicationLog({
      medicationId: data.medicationId,
      taken: data.taken,
      takenAt: data.takenAt ? new Date(data.takenAt).toISOString() : undefined,
      notes: data.notes || undefined,
      loggedAt: data.loggedAt ? new Date(data.loggedAt).toISOString() : undefined,
    })
    onSaved()
  }

  return (
    <ModalShell title="Log Medication" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Medication</label>
          <select {...register('medicationId')} className={inputCls(!!errors.medicationId)}>
            <option value="">Select…</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.dosage ? ` — ${m.dosage}` : ''}
              </option>
            ))}
          </select>
          {errors.medicationId && <p className="mt-1 text-xs text-red-600">{errors.medicationId.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setValue('taken', v)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  taken === v
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-teal-400'
                }`}
              >
                {v ? '✓ Taken' : '✗ Skipped'}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('taken')} />
        </div>

        {taken && (
          <div>
            <label className={labelCls}>Taken at (optional)</label>
            <input type="datetime-local" {...register('takenAt')} className={inputCls(false)} />
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
