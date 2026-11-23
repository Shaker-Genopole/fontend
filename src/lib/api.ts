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

export type Role = 'consumer' | 'provider' | 'admin'

export type ApiAccount = {
  _id: string
  email: string
  role: Role
  organisation: string
  suiAddress?: string
}

export type SlaTerms = {
  maxLatencyMs: number
  latencyQuorumBp: number
  minAvailabilityBp: number
  maxIntervalSec: number
  periodMs: number
  totalPeriods: number
  graceMs: number
  rewardPerPeriod: number
  penaltyPerPeriod: number
}

export type ApiAgreement = {
  _id: string
  onChainId?: string
  title: string
  consumerId: string
  providerId: string
  terms: SlaTerms
  status: 'proposed' | 'active' | 'closed' | 'cancelled'
  startMs?: number
  deploymentCommitment?: string
  createdAt: string
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

type Session = { token: string; account: ApiAccount }

// ---- auth ---------------------------------------------------------------------------
export const authApi = {
  signUp: async (body: {
    email: string
    password: string
    role: 'consumer' | 'provider'
    organisation: string
  }) => (await api.post<Session>('/api/auth/signup', body)).data,
  signIn: async (email: string, password: string) =>
    (await api.post<Session>('/api/auth/login', { email, password })).data,
  signOut: async () => {
    await api.post('/api/auth/logout').catch(() => undefined)
  },
  me: async () => (await api.get<ApiAccount>('/api/auth/me')).data,
  updateProfile: async (organisation: string) =>
    (await api.patch<ApiAccount>('/api/auth/me', { organisation })).data,
  providers: async () =>
    (
      await api.get<
        Array<Pick<ApiAccount, '_id' | 'organisation' | 'suiAddress'>>
      >('/api/auth/providers')
    ).data,
  walletChallenge: async () =>
    (
      await api.post<{ message: string; expiresAt: string }>(
        '/api/auth/wallet/challenge'
      )
    ).data,
  linkWallet: async (address: string, signature: string) =>
    (await api.post<ApiAccount>('/api/auth/wallet', { address, signature }))
      .data,
  unlinkWallet: async () => {
    await api.delete('/api/auth/wallet')
  },
}

/** Kept for the sign-in form. */
export const login = authApi.signIn

// ---- agreements ---------------------------------------------------------------------------
export const agreementsApi = {
  list: async () => (await api.get<ApiAgreement[]>('/api/agreements')).data,
  create: async (body: {
    title: string
    providerId: string
    terms: SlaTerms
    onChainId?: string
  }) => (await api.post<ApiAgreement>('/api/agreements', body)).data,
  registerDeployment: async (
    id: string,
    body: {
      locations: string[]
      sensorConfig: Record<string, unknown>
      devices: Array<{
        deviceId: string
        kind: string
        expectedIntervalSec: number
        edgeNodeId: string
      }>
    }
  ) =>
    (
      await api.post<{ deploymentCommitment: string }>(
        `/api/agreements/${id}/deployment`,
        body
      )
    ).data,
  activate: async (
    id: string,
    body: { onChainId?: string; startMs?: number }
  ) =>
    (await api.post<ApiAgreement>(`/api/agreements/${id}/activate`, body)).data,
  get: async (id: string) =>
    (
      await api.get<
        ApiAgreement & {
          deviceCount: number
          periods: Array<{
            period: number
            status: string
            jobId?: string
            metricsCommitment?: string
            txDigest?: string
          }>
        }
      >(`/api/agreements/${id}`)
    ).data,
  proof: async (id: string) =>
    (await api.get<ApiProof & { proofHex?: string }>(`/api/proofs/${id}`)).data,
}
