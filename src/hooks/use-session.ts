import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { LIVE_API, authApi, type ApiAccount } from '@/lib/api'

export const toAuthUser = (account: ApiAccount) => ({
  accountNo: account._id,
  email: account.email,
  role: [account.role],
  organisation: account.organisation,
  suiAddress: account.suiAddress,
  exp: Date.now() + 12 * 60 * 60 * 1000,
})

/**
 * The signed-in account from the API gateway. Restores the user after a page
 * reload (only the token is kept in a cookie) and keeps it in sync.
 */
export function useSession() {
  const { auth } = useAuthStore()
  const query = useQuery({
    queryKey: ['me', auth.accessToken],
    queryFn: authApi.me,
    enabled: LIVE_API && Boolean(auth.accessToken),
    staleTime: 60_000,
  })
  useEffect(() => {
    if (query.data) auth.setUser(toAuthUser(query.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])
  return {
    account: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
