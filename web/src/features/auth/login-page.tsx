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
import { useAuth } from './auth-context'
import { safeNextPath } from '@/lib/safe-next-path'
import { centerPhoto } from '@/features/public-booking/center-photos'
import { centerSlugFromNext } from './center-slug'

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

export function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const next = safeNextPath(useSearchParams().get('next'))
  const slug = centerSlugFromNext(next)
  const centerLogo = slug ? centerPhoto(slug) : null
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
    <div className="center-page min-h-svh">
      <title>Ingresar | CentradaMente</title>
      <header className="bg-gradient-to-r from-(--cp-card) to-white">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/logo-centradamente.svg" alt="" aria-hidden="true" className="h-12 w-auto" />
          <span className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-(--cp-terracota-text)">Centrada</span>
            <span>Mente</span>
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-14">
        <img
          src={centerLogo ?? '/logo-centradamente.svg'}
          alt={centerLogo ? 'Logo del centro' : 'CentradaMente'}
          className="mx-auto mb-8 h-40 w-auto max-w-full object-contain"
        />
        <h1 className="border-b-2 border-(--cp-granate) pb-3 text-center text-2xl font-bold tracking-tight">
          Ingresa a tu cuenta
        </h1>
        <div className="mt-8">
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold text-(--cp-granate)">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                className="h-11 rounded-xl border-(--cp-granate) px-3 placeholder:text-neutral-600"
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
              <Label htmlFor="password" className="text-base font-semibold text-(--cp-granate)">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-(--cp-granate) px-3 placeholder:text-neutral-600 pr-12"
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
                  className="absolute inset-y-0 right-0 my-auto flex size-11 items-center justify-center rounded-lg border border-transparent text-neutral-600 outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transform-none motion-reduce:active:scale-100"
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
            <Button type="submit" size="lg" className="h-11 w-full rounded-xl text-base active:scale-[0.97] motion-reduce:active:scale-100" disabled={isSubmitting}>
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
