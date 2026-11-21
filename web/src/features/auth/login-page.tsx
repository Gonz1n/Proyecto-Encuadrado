'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from './auth-context'
import { safeNextPath } from '@/lib/safe-next-path'

const loginSchema = z.object({
  email: z.email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginValues = z.infer<typeof loginSchema>

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) {
    const detail = (error.data as { detail?: unknown } | null)?.detail
    return typeof detail === 'string' ? detail : 'Correo o contraseña incorrectos'
  }
  return 'No pudimos conectar con el servidor. Intenta de nuevo.'
}

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-semibold', className)}>
      <img src="/logo-centradamente.svg" alt="" aria-hidden="true" className="h-8 w-auto" />
      CentradaMente
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const next = safeNextPath(useSearchParams().get('next'))
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await login(email, password)
      router.replace(next)
      router.refresh()
    } catch (error) {
      setError('root', { message: loginErrorMessage(error) })
    }
  })

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <title>Ingresar | CentradaMente</title>
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Wordmark />
        <p className="max-w-sm text-2xl leading-snug font-semibold tracking-tight text-balance">
          La agenda de tu centro, ordenada para todo el equipo.
        </p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm space-y-8">
          <Wordmark className="text-primary lg:hidden" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Ingresa a tu cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Usa el correo con el que te registraron en tu centro.
            </p>
          </div>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="nombre@centro.cl"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-11"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 my-auto flex size-11 items-center justify-center rounded-lg border border-transparent text-muted-foreground outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transform-none motion-reduce:active:scale-100"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            {errors.root ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {errors.root.message}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
