import { createFileRoute } from '@tanstack/react-router'
import { Infrastructure } from '@/features/infrastructure'

export const Route = createFileRoute('/_authenticated/infrastructure/')({
  component: Infrastructure,
})
