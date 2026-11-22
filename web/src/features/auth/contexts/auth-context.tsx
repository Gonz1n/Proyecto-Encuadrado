'use client'

import { createContext, use, useEffect, useMemo, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { authApi } from '../api/auth-api'
import { type CurrentUser } from '../types/auth'
import { isUnauthorized } from '@/utils/api-errors'
import { useMeQuery } from '../hooks/use-me-query'

type AuthContextValue = {
  user: CurrentUser | undefined
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function endSession() {
  window.location.replace('/login')
}

export function AuthProvider({ hasSession, children }: { hasSession: boolean; children: ReactNode }) {
  const queryClient = useQueryClient()
  const me = useMeQuery(hasSession)

  useEffect(() => {
    const onCacheEvent = (event: { type: string; action?: { type: string; error?: unknown } }) => {
      if (
        event.action?.type === 'error' && isUnauthorized(event.action.error) &&
        (hasSession || queryClient.getQueryData(queryKeys.me) !== undefined)
      ) {
        endSession()
      }
    }
    const unsubscribeQueries = queryClient.getQueryCache().subscribe(onCacheEvent)
    const unsubscribeMutations = queryClient.getMutationCache().subscribe(onCacheEvent)
    return () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }, [queryClient, hasSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data,
      login: async (email, password) => {
        const { user } = await authApi.login(email, password)
        queryClient.setQueryData(queryKeys.me, user)
      },
      logout: async () => {
        await authApi.logout().catch(() => undefined)
        endSession()
      },
    }),
    [me.data, queryClient],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
