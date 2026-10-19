import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const tone = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  bad: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  muted: 'text-muted-foreground',
} as const

export type Tone = keyof typeof tone

const toneByValue: Record<string, Tone> = {
  compliant: 'good',
  verified: 'good',
  online: 'good',
  healthy: 'good',
  breached: 'bad',
  rejected: 'bad',
  offline: 'bad',
  overloaded: 'bad',
  pending: 'warn',
  degraded: 'warn',
  'power-saving': 'warn',
  maintenance: 'warn',
  negotiating: 'info',
}

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  return (
    <Badge
      variant='outline'
      className={cn(
        'capitalize',
        tone[toneByValue[value] ?? 'muted'],
        className
      )}
    >
      {label ?? value.replace('-', ' ')}
    </Badge>
  )
}
