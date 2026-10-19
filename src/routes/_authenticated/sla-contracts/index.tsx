import { createFileRoute } from '@tanstack/react-router'
import { SlaContracts } from '@/features/sla-contracts'

export const Route = createFileRoute('/_authenticated/sla-contracts/')({
  component: SlaContracts,
})
