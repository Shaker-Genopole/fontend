import { useNavigate, useLocation } from '@tanstack/react-router'
import { useDAppKit } from '@mysten/dapp-kit-react'
import { useAuthStore } from '@/stores/auth-store'
import { LIVE_API, authApi } from '@/lib/api'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()
  const dAppKit = useDAppKit()

  const handleSignOut = async () => {
    if (LIVE_API) await authApi.signOut()
    await dAppKit.disconnectWallet().catch(() => undefined)
    auth.reset()
    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
