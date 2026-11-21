import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/auth-context'
import { hasSession } from '@/lib/session'

export default async function SessionLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  return <AuthProvider hasSession={hasSession(cookieStore)}>{children}</AuthProvider>
}
