import { useQuery } from '@tanstack/react-query'
import { proofs as seedProofs, summary as seedSummary } from '@/data/dataset'
import type { ZkProof } from '@/data/types'
import { LIVE_API, api, type ApiKpis, type ApiProof } from './api'

export type DataSource = 'live' | 'synthetic'

const CIRCUIT_FILE = {
  sla: 'sla_compliance.circom',
  negotiation: 'resource_negotiation.circom',
} as const

/** Maps a prover-worker proof record onto the console's proof model. */
export function toZkProof(p: ApiProof): ZkProof {
  const ok = p.status === 'proven' || p.status === 'submitted'
  return {
    id: p._id.slice(0, 8).toUpperCase(),
    contractId: p.agreementId ?? p.requestId ?? '—',
    circuit: CIRCUIT_FILE[p.kind],
    scheme: 'Groth16',
    curve: 'BLS12-381',
    publicSignals: (p.publicSignals ?? []).map((s, i) =>
      s.length > 18 ? `s${i}=${s.slice(0, 10)}…` : `s${i}=${s}`
    ),
    proveMs: p.provingMs ?? 0,
    verifyMs: p.verifyMs ?? 0,
    sizeBytes: p.proofSizeBytes ?? 0,
    gasSui: p.gasUsedMist ? p.gasUsedMist / 1e9 : 0,
    result: ok
      ? 'verified'
      : p.status === 'failed' || p.status === 'non_compliant'
        ? 'rejected'
        : 'pending',
    txDigest: p.txDigest ?? '',
    timestamp: new Date(p.completedAt).toISOString(),
  }
}

/** Dashboard headline figures: live KPIs from the gateway, synthetic seed otherwise. */
export function useSummary() {
  const query = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => (await api.get<ApiKpis>('/api/kpis')).data,
    enabled: LIVE_API,
    refetchInterval: 15_000,
  })
  const k = query.data
  if (!LIVE_API || !k)
    return { source: 'synthetic' as DataSource, summary: seedSummary }
  return {
    source: 'live' as DataSource,
    summary: {
      ...seedSummary,
      complianceRate:
        k.slaComplianceRate === null
          ? seedSummary.complianceRate
          : Math.round(k.slaComplianceRate * 1000) / 10,
      medianProveMs: k.zkProofGenerationMs.median ?? seedSummary.medianProveMs,
      medianVerifyMs: k.zkVerificationMs.median ?? seedSummary.medianVerifyMs,
      meanGasSui: k.gasPerProofSui ?? seedSummary.meanGasSui,
      medianLatencyS:
        k.telemetryLatencyMs.median === null
          ? seedSummary.medianLatencyS
          : Math.round(k.telemetryLatencyMs.median / 10) / 100,
    },
  }
}

/** Proof ledger: live proof records from the gateway, synthetic seed otherwise. */
export function useProofLedger() {
  const query = useQuery({
    queryKey: ['proofs'],
    queryFn: async () =>
      (await api.get<ApiProof[]>('/api/proofs?limit=500')).data.map(toZkProof),
    enabled: LIVE_API,
    refetchInterval: 15_000,
  })
  if (!LIVE_API || !query.data)
    return { source: 'synthetic' as DataSource, proofs: seedProofs }
  return { source: 'live' as DataSource, proofs: query.data }
}
