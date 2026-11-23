import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  // Sign-in is the entry page: every console page requires a session
  // (from the API gateway in live mode, a local demo session otherwise).
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().auth.accessToken) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
  },
  component: AuthenticatedLayout,
})
