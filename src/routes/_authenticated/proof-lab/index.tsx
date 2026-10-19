import { createFileRoute } from '@tanstack/react-router'
import { ProofLab } from '@/features/proof-lab'

export const Route = createFileRoute('/_authenticated/proof-lab/')({
  component: ProofLab,
})
