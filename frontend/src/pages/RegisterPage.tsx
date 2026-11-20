import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register as registerUser } from '../api/auth'

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    displayName: z.string().min(1, 'Display name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      })
      localStorage.setItem('accessToken', result.accessToken)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className={inputCls(!!errors.email)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Display name" error={errors.displayName?.message}>
            <input
              type="text"
              {...register('displayName')}
              className={inputCls(!!errors.displayName)}
              placeholder="Your name"
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              {...register('password')}
              className={inputCls(!!errors.password)}
              placeholder="At least 8 characters"
            />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <input
              type="password"
              {...register('confirmPassword')}
              className={inputCls(!!errors.confirmPassword)}
            />
          </Field>

          {errors.root && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={submitBtnCls}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`

const submitBtnCls =
  'w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors'
