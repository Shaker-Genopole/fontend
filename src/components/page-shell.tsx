import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type PageShellProps = {
  title: string
  description: string
  actions?: React.ReactNode
  children: React.ReactNode
}

/** Common header + heading for the ZK-SLA console pages. */
export function PageShell({
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <Badge variant='outline' className='hidden gap-1 sm:inline-flex'>
          <FlaskConical className='size-3' />
          Simulated data · Sui Testnet profile
        </Badge>
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
            <p className='max-w-3xl text-muted-foreground'>{description}</p>
          </div>
          {actions}
        </div>
        {children}
      </Main>
    </>
  )
}
