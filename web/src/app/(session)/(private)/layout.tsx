'use client'

import type { ReactNode } from 'react'
import { RequireAuth } from '@/features/auth/require-auth'

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
