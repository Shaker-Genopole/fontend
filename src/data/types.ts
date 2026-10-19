/**
 * Domain model of the ZK-SLA console.
 *
 * The entities mirror the architecture of the research proposal
 * "Zero-Knowledge Smart Contracts for Service-Level Agreements in
 * Microservice Healthcare Edge-Cloud AIoT Deployment Applications":
 * IoT sensors attach to edge nodes, SLA contracts live on Sui as Move
 * objects, and providers submit Groth16 proofs attesting to QoS compliance.
 */

export type SensorKind = 'ecg' | 'temperature' | 'glucose' | 'camera' | 'spo2'

export type DeviceStatus = 'online' | 'degraded' | 'offline' | 'power-saving'

export type IoTDevice = {
  /** Public, non-identifying handle used in the UI. */
  alias: string
  /**
   * Hiding commitment over (device UUID, patient pseudonym, location, salt).
   * Only this value ever leaves the edge; the preimage stays private.
   */
  commitment: string
  kind: SensorKind
  edgeNode: string
  ward: string
  status: DeviceStatus
  batteryPct: number
  samplingHz: number
  lastSeenSec: number
}

export type EdgeNode = {
  id: string
  site: string
  cpuPct: number
  memPct: number
  energyWh: number
  devices: number
  inferenceModel: string
  medianInferenceMs: number
  status: 'healthy' | 'overloaded' | 'maintenance'
}

export type SlaMetric =
  | 'ecg-latency'
  | 'ecg-availability'
  | 'glucose-interval'
  | 'auth-decision'
  | 'uptime'

export type SlaStatus = 'compliant' | 'breached' | 'pending' | 'negotiating'

export type SlaContract = {
  id: string
  /** Sui object ID of the shared SLA object. */
  objectId: string
  provider: string
  consumer: string
  metric: SlaMetric
  /** Human-readable predicate, e.g. "latency ≤ 2 s". */
  predicate: string
  threshold: number
  unit: string
  comparator: 'lte' | 'gte'
  observed: number
  status: SlaStatus
  /** Escrowed collateral in SUI. */
  collateralSui: number
  penaltySui: number
  incentiveSui: number
  proofs: number
  validUntil: string
}

export type ProofResult = 'verified' | 'rejected' | 'pending'

export type ZkProof = {
  id: string
  contractId: string
  circuit: string
  scheme: 'Groth16'
  curve: 'BN254'
  /** Aggregated public signals only — no raw sensor or identity data. */
  publicSignals: string[]
  proveMs: number
  verifyMs: number
  sizeBytes: number
  gasSui: number
  result: ProofResult
  txDigest: string
  timestamp: string
}

export type ProviderOffer = {
  provider: string
  region: string
  /** Committed (hidden) capabilities; only proofs over them are revealed. */
  commitment: string
  hidden: {
    storageTb: number
    latencyMs: number
    costSuiPerMonth: number
    availabilityPct: number
  }
}

export type KpiDefinition = {
  kpi: string
  metric: string
  method: string
  value: string
  target: string
  met: boolean | null
}
