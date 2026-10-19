import { createFileRoute } from '@tanstack/react-router'
import { Negotiation } from '@/features/negotiation'

export const Route = createFileRoute('/_authenticated/negotiation/')({
  component: Negotiation,
})
