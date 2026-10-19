import { createFileRoute } from '@tanstack/react-router'
import { ZkProofs } from '@/features/zk-proofs'

export const Route = createFileRoute('/_authenticated/zk-proofs/')({
  component: ZkProofs,
})
