import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { profileApi } from '../api/profile-api'
import type { ProfileUpdate } from '../types/profile'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileUpdate) => profileApi.update(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.me, saved)
      queryClient.invalidateQueries({ queryKey: queryKeys.allPublicCenters })
    },
  })
}
