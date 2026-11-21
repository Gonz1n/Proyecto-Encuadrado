'use client'

import { createContext, use, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { authApi, type CurrentUser } from './api'
import { isUnauthorized, useMeQuery } from './hooks'

type AuthContextValue = {
  user: CurrentUser | undefined
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ hasSession, children }: { hasSession: boolean; children: ReactNode }) {
  const queryClient = useQueryClient()
  const me = useMeQuery(hasSession)

  const endSession = useCallback(() => {
    window.location.replace('/login')
  }, [])

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
  }, [queryClient, endSession, hasSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data,
      isLoading: me.isLoading,
      login: async (email, password) => {
        const { user } = await authApi.login(email, password)
        queryClient.setQueryData(queryKeys.me, user)
      },
      logout: async () => {
        await authApi.logout().catch(() => undefined)
        endSession()
      },
    }),
    [me.data, me.isLoading, queryClient, endSession],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
