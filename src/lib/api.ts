import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Live mode talks to the ZK-SLA api-gateway (Shaker-Genopole/services).
 * It is enabled at build time with VITE_LIVE_API=true; the container image
 * proxies /api to the gateway, so the default base URL is same-origin.
 */
export const LIVE_API = import.meta.env.VITE_LIVE_API === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type ApiAccount = {
  _id: string
  email: string
  role: 'consumer' | 'provider' | 'admin'
  organisation: string
}

export type ApiKpis = {
  zkProofGenerationMs: { median: number | null; p95: number | null }
  zkVerificationMs: { median: number | null }
  proofSizeBytes: number | null
  slaComplianceRate: number | null
  settledPeriods: number
  endToEndProofLatencyMs: { median: number | null }
  telemetryLatencyMs: { median: number | null; p95: number | null }
  gasPerProofSui: number | null
  failedJobs: number
  activeProverWorkers: number
  alertsLast24h: number
}

export type ApiProof = {
  _id: string
  kind: 'sla' | 'negotiation'
  status:
    | 'proven'
    | 'submitted'
    | 'non_compliant'
    | 'insufficient_data'
    | 'failed'
  agreementId?: string
  period?: number
  requestId?: string
  provingMs?: number
  verifyMs?: number
  proofSizeBytes?: number
  publicSignals?: string[]
  txDigest?: string
  gasUsedMist?: number
  completedAt: number
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; account: ApiAccount }>(
    '/api/auth/login',
    { email, password }
  )
  return data
}
